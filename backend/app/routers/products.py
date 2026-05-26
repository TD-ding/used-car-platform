import os
import imghdr
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Product, User, Category
from app.schemas import ProductCreate, ProductResponse
from app.auth import get_current_user, require_role
from app.config import settings

router = APIRouter(prefix="/api/products", tags=["商品"])

ALLOWED_IMAGE_TYPES = {"jpeg", "png", "gif", "webp"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB


def _enrich_products(products, db):
    """Batch-load seller and category data to avoid N+1 queries."""
    if not products:
        return []
    seller_ids = {p.seller_id for p in products}
    cat_ids = {p.category_id for p in products if p.category_id}
    sellers = {s.id: s.username for s in db.query(User).filter(User.id.in_(seller_ids)).all()}
    cats = {c.id: c.name for c in db.query(Category).filter(Category.id.in_(cat_ids)).all()} if cat_ids else {}

    result = []
    for p in products:
        pr = ProductResponse.model_validate(p)
        pr.seller_name = sellers.get(p.seller_id, "")
        pr.category_name = cats.get(p.category_id, "") if p.category_id else ""
        result.append(pr)
    return result


@router.get("", response_model=list[ProductResponse])
def list_products(
    keyword: str = Query(None),
    category_id: int = Query(None),
    min_price: float = Query(None),
    max_price: float = Query(None),
    condition_level: str = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    db: Session = Depends(get_db),
):
    query = db.query(Product).filter(Product.status == "approved")
    if keyword:
        query = query.filter(Product.title.contains(keyword))
    if category_id:
        query = query.filter(Product.category_id == category_id)
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    if condition_level:
        query = query.filter(Product.condition_level == condition_level)

    products = query.order_by(Product.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return _enrich_products(products, db)


@router.get("/count")
def count_products(db: Session = Depends(get_db)):
    return {"total": db.query(Product).filter(Product.status == "approved").count()}


@router.get("/my", response_model=list[ProductResponse])
def my_products(
    status: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Product).filter(Product.seller_id == current_user.id)
    if status:
        query = query.filter(Product.status == status)
    products = query.order_by(Product.created_at.desc()).all()

    cat_ids = {p.category_id for p in products if p.category_id}
    cats = {c.id: c.name for c in db.query(Category).filter(Category.id.in_(cat_ids)).all()} if cat_ids else {}

    result = []
    for p in products:
        pr = ProductResponse.model_validate(p)
        pr.seller_name = current_user.username
        pr.category_name = cats.get(p.category_id, "") if p.category_id else ""
        result.append(pr)
    return result


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="商品不存在")
    product.views += 1
    db.commit()

    return _enrich_products([product], db)[0]


@router.post("", response_model=ProductResponse)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("merchant", "admin")),
):
    product = Product(
        title=product_data.title,
        description=product_data.description,
        price=product_data.price,
        original_price=product_data.original_price,
        condition_level=product_data.condition_level,
        category_id=product_data.category_id,
        image=product_data.image,
        seller_id=current_user.id,
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    pr = ProductResponse.model_validate(product)
    pr.seller_name = current_user.username
    return pr


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="商品不存在")
    if product.seller_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="无权修改此商品")

    product.title = product_data.title
    product.description = product_data.description
    product.price = product_data.price
    product.original_price = product_data.original_price
    product.condition_level = product_data.condition_level
    product.category_id = product_data.category_id
    product.image = product_data.image
    db.commit()
    db.refresh(product)

    pr = ProductResponse.model_validate(product)
    pr.seller_name = current_user.username
    return pr


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="商品不存在")
    if product.seller_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="无权删除此商品")

    product.status = "off_shelf"
    db.commit()
    return {"message": "商品已下架"}


@router.post("/upload")
def upload_image(file: UploadFile = File(...)):
    # Validate file size
    content = file.file.read()
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="图片大小不能超过5MB")

    # Validate image type by magic bytes
    img_type = imghdr.what(None, h=content[:32])
    if not img_type or img_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="只支持 JPG/PNG/GIF/WebP 格式的图片")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    filename = f"{uuid.uuid4().hex}.{img_type}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(content)
    return {"url": f"/uploads/{filename}"}
