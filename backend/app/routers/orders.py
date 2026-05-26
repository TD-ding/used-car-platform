import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Order, OrderItem, Product, User
from app.schemas import OrderCreate, OrderResponse, OrderItemResponse
from app.auth import get_current_user, require_role

router = APIRouter(prefix="/api/orders", tags=["订单"])


def make_order_no():
    return f"ORD{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6].upper()}"


@router.post("/{product_id}")
def create_order(
    product_id: int,
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="商品不存在")
    if product.status != "approved":
        raise HTTPException(status_code=400, detail="商品不可购买")
    if product.seller_id == current_user.id:
        raise HTTPException(status_code=400, detail="不能购买自己的商品")

    order = Order(
        order_no=make_order_no(),
        buyer_id=current_user.id,
        total_price=product.price,
        status="pending",
        address=order_data.address,
        phone=order_data.phone,
        remark=order_data.remark,
    )
    db.add(order)
    db.flush()

    order_item = OrderItem(order_id=order.id, product_id=product.id, price=product.price)
    db.add(order_item)

    product.status = "sold"
    db.commit()
    db.refresh(order)
    return {"order_no": order.order_no, "message": "下单成功"}


@router.get("/my", response_model=list[OrderResponse])
def my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    orders = db.query(Order).filter(Order.buyer_id == current_user.id).order_by(Order.created_at.desc()).all()
    result = []
    for order in orders:
        o = OrderResponse.model_validate(order)
        o.items = []
        for item in order.items:
            ir = OrderItemResponse.model_validate(item)
            p = db.query(Product).filter(Product.id == item.product_id).first()
            ir.product_title = p.title if p else "已删除"
            ir.product_image = p.image if p else ""
            o.items.append(ir)
        result.append(o)
    return result


@router.get("/sold", response_model=list[OrderResponse])
def sold_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Find orders containing products sold by this user
    sold_product_ids = [p.id for p in db.query(Product).filter(Product.seller_id == current_user.id).all()]
    if not sold_product_ids:
        return []

    order_ids = [oi.order_id for oi in db.query(OrderItem).filter(OrderItem.product_id.in_(sold_product_ids)).all()]
    if not order_ids:
        return []

    orders = db.query(Order).filter(Order.id.in_(order_ids)).order_by(Order.created_at.desc()).all()
    result = []
    for order in orders:
        o = OrderResponse.model_validate(order)
        o.items = []
        for item in order.items:
            ir = OrderItemResponse.model_validate(item)
            p = db.query(Product).filter(Product.id == item.product_id).first()
            ir.product_title = p.title if p else "已删除"
            ir.product_image = p.image if p else ""
            o.items.append(ir)
        result.append(o)
    return result


@router.put("/{order_id}/status")
def update_order_status(
    order_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    valid_statuses = {"paid", "shipped", "completed", "cancelled"}
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="无效的订单状态")

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")

    # Buyer can cancel; seller can ship; both can complete
    is_buyer = order.buyer_id == current_user.id
    sold_pids = [p.id for p in db.query(Product).filter(Product.seller_id == current_user.id).all()]
    is_seller = any(oi.product_id in sold_pids for oi in order.items)
    if not is_buyer and not is_seller and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="无权操作此订单")

    order.status = status
    db.commit()
    return {"message": "状态更新成功"}
