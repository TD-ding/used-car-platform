from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Comment, Product, User
from app.schemas import CommentCreate, CommentResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/comments", tags=["评论"])


@router.get("/product/{product_id}", response_model=list[CommentResponse])
def product_comments(product_id: int, db: Session = Depends(get_db)):
    comments = db.query(Comment).filter(Comment.product_id == product_id).order_by(Comment.created_at.desc()).all()
    result = []
    for c in comments:
        cr = CommentResponse.model_validate(c)
        user = db.query(User).filter(User.id == c.user_id).first()
        cr.username = user.username if user else "匿名"
        result.append(cr)
    return result


@router.post("/product/{product_id}", response_model=CommentResponse)
def create_comment(
    product_id: int,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="商品不存在")

    comment = Comment(
        product_id=product_id,
        user_id=current_user.id,
        content=comment_data.content,
        rating=min(max(comment_data.rating, 1), 5),
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    cr = CommentResponse.model_validate(comment)
    cr.username = current_user.username
    return cr


@router.delete("/{comment_id}")
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="评论不存在")
    if comment.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="无权删除此评论")
    db.delete(comment)
    db.commit()
    return {"message": "评论已删除"}
