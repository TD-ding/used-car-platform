from typing import Optional, List
from datetime import datetime

from pydantic import BaseModel, EmailStr


# --- Auth ---
class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: Optional[str] = "user"


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    avatar: Optional[str] = ""
    is_active: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- Product ---
class ProductCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    price: float
    original_price: Optional[float] = 0
    condition_level: Optional[str] = "几乎全新"
    category_id: Optional[int] = None
    image: Optional[str] = ""


class ProductResponse(BaseModel):
    id: int
    title: str
    description: str
    price: float
    original_price: float
    condition_level: str
    image: str
    category_id: Optional[int]
    seller_id: int
    status: str
    views: int
    created_at: datetime
    seller_name: Optional[str] = ""
    category_name: Optional[str] = ""

    class Config:
        from_attributes = True


# --- Order ---
class OrderCreate(BaseModel):
    address: str
    phone: str
    remark: Optional[str] = ""


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    price: float
    product_title: Optional[str] = ""
    product_image: Optional[str] = ""

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: int
    order_no: str
    buyer_id: int
    total_price: float
    status: str
    address: str
    phone: str
    remark: str
    created_at: datetime
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True


# --- Comment ---
class CommentCreate(BaseModel):
    content: str
    rating: Optional[int] = 5


class CommentResponse(BaseModel):
    id: int
    product_id: int
    user_id: int
    content: str
    rating: int
    created_at: datetime
    username: Optional[str] = ""

    class Config:
        from_attributes = True


# --- Category ---
class CategoryCreate(BaseModel):
    name: str
    sort_order: Optional[int] = 0


class CategoryResponse(BaseModel):
    id: int
    name: str
    sort_order: int

    class Config:
        from_attributes = True


# --- Admin ---
class UserUpdate(BaseModel):
    role: Optional[str] = None
    is_active: Optional[int] = None


class ProductApprove(BaseModel):
    status: str  # approved or rejected
