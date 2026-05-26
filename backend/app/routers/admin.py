from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import User, Product, Order, OrderItem, Category
from app.schemas import UserResponse, UserUpdate, ProductResponse, ProductApprove, CategoryCreate, CategoryResponse
from app.auth import require_role

router = APIRouter(prefix="/api/admin", tags=["管理"])


@router.get("/users", response_model=list[UserResponse])
def list_users(
    search: str = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    query = db.query(User)
    if search:
        query = query.filter(
            (User.username.contains(search)) | (User.email.contains(search))
        )
    return query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()


@router.put("/users/{user_id}")
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    if user_data.role is not None:
        user.role = user_data.role
    if user_data.is_active is not None:
        user.is_active = user_data.is_active
    db.commit()
    return {"message": "用户信息已更新"}


@router.get("/products/pending", response_model=list[ProductResponse])
def pending_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    products = db.query(Product).filter(Product.status == "pending").all()
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


@router.put("/products/{product_id}/approve")
def approve_product(
    product_id: int,
    approve_data: ProductApprove,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="商品不存在")
    if approve_data.status not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="无效状态")
    product.status = approve_data.status
    db.commit()
    return {"message": f"商品已{'审核通过' if approve_data.status == 'approved' else '拒绝'}"}


@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    total_users = db.query(User).count()
    total_products = db.query(Product).count()
    total_orders = db.query(Order).count()
    total_revenue = db.query(func.sum(Order.total_price)).filter(Order.status == "completed").scalar() or 0
    pending_products = db.query(Product).filter(Product.status == "pending").count()
    return {
        "total_users": total_users,
        "total_products": total_products,
        "total_orders": total_orders,
        "total_revenue": float(total_revenue),
        "pending_products": pending_products,
    }


@router.get("/categories", response_model=list[CategoryResponse])
def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    return db.query(Category).order_by(Category.sort_order).all()


@router.post("/categories", response_model=CategoryResponse)
def create_category(
    cat_data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    cat = Category(name=cat_data.name, sort_order=cat_data.sort_order)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/categories/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="分类不存在")
    # Null out references before deleting to avoid FK constraint errors
    db.query(Product).filter(Product.category_id == category_id).update({"category_id": None})
    db.delete(cat)
    db.commit()
    return {"message": "分类已删除"}
