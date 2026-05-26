import os
import imghdr
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import Product, User, Category, Comment, Favorite, Order, OrderItem
from app.schemas import ProductCreate, ProductResponse
from app.auth import get_current_user, require_role
from app.config import settings

router = APIRouter(prefix="/api/products", tags=["商品"])

ALLOWED_IMAGE_TYPES = {"jpeg", "png", "gif", "webp"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB


def _enrich_products(products, db, user_id=None):
    """Batch-load seller, category, and rating data."""
    if not products:
        return []
    seller_ids = {p.seller_id for p in products}
    cat_ids = {p.category_id for p in products if p.category_id}
    product_ids = [p.id for p in products]
    sellers = {s.id: s.username for s in db.query(User).filter(User.id.in_(seller_ids)).all()}
    cats = {c.id: c.name for c in db.query(Category).filter(Category.id.in_(cat_ids)).all()} if cat_ids else {}

    # Batch-load ratings
    rating_rows = db.query(
        Comment.product_id, func.avg(Comment.rating), func.count(Comment.id)
    ).filter(Comment.product_id.in_(product_ids)).group_by(Comment.product_id).all()
    ratings = {r[0]: (round(float(r[1]), 1) if r[1] else 0, int(r[2])) for r in rating_rows}

    # Batch-load favorites for current user
    fav_ids = set()
    if user_id:
        fav_rows = db.query(Favorite.product_id).filter(
            Favorite.user_id == user_id, Favorite.product_id.in_(product_ids)
        ).all()
        fav_ids = {f[0] for f in fav_rows}

    result = []
    for p in products:
        pr = ProductResponse.model_validate(p)
        pr.seller_name = sellers.get(p.seller_id, "")
        pr.category_name = cats.get(p.category_id, "") if p.category_id else ""
        avg, count = ratings.get(p.id, (0, 0))
        pr.avg_rating = avg
        pr.rating_count = count
        pr.is_favorited = p.id in fav_ids
        result.append(pr)
    return result


@router.get("", response_model=list[ProductResponse])
def list_products(
    keyword: str = Query(None),
    category_id: int = Query(None),
    min_price: float = Query(None),
    max_price: float = Query(None),
    condition_level: str = Query(None),
    sort: str = Query("newest"),
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

    # Sort order
    if sort == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort == "price_desc":
        query = query.order_by(Product.price.desc())
    else:
        query = query.order_by(Product.created_at.desc())

    products = query.offset((page - 1) * page_size).limit(page_size).all()

    # Try to get current user (optional)
    user_id = None
    try:
        from app.auth import oauth2_scheme
        token = oauth2_scheme(None)
        if token:
            from jose import jwt
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            user_id = payload.get("sub")
    except Exception:
        pass

    return _enrich_products(products, db, user_id)


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
    return _enrich_products(products, db, current_user.id)


@router.get("/favorites", response_model=list[ProductResponse])
def my_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    favs = db.query(Favorite).filter(Favorite.user_id == current_user.id).order_by(Favorite.created_at.desc()).all()
    product_ids = [f.product_id for f in favs]
    products = db.query(Product).filter(Product.id.in_(product_ids)).all() if product_ids else []
    return _enrich_products(products, db, current_user.id)


@router.get("/favorites/count")
def favorites_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return {"count": db.query(Favorite).filter(Favorite.user_id == current_user.id).count()}


@router.get("/stats")
def seller_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total = db.query(Product).filter(Product.seller_id == current_user.id).count()
    on_sale = db.query(Product).filter(Product.seller_id == current_user.id, Product.status == "approved").count()
    sold = db.query(Product).filter(Product.seller_id == current_user.id, Product.status == "sold").count()
    revenue_rows = db.query(func.sum(Order.total_price)).filter(
        Order.status == "completed",
        Order.id.in_(
            db.query(OrderItem.order_id).join(Product).filter(Product.seller_id == current_user.id)
        )
    ).scalar()
    return {
        "total_products": total,
        "on_sale": on_sale,
        "sold": sold,
        "revenue": float(revenue_rows or 0),
    }


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
    content = file.file.read()
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="图片大小不能超过5MB")

    img_type = imghdr.what(None, h=content[:32])
    if not img_type or img_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="只支持 JPG/PNG/GIF/WebP 格式的图片")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    filename = f"{uuid.uuid4().hex}.{img_type}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(content)
    return {"url": f"/uploads/{filename}"}


@router.post("/{product_id}/favorite")
def toggle_favorite(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="商品不存在")

    existing = db.query(Favorite).filter(
        Favorite.user_id == current_user.id, Favorite.product_id == product_id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"favorited": False}
    else:
        fav = Favorite(user_id=current_user.id, product_id=product_id)
        db.add(fav)
        db.commit()
        return {"favorited": True}
