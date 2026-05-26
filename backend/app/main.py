import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import engine, Base, get_db
from app.models import Category
from app.routers import auth, products, orders, comments, admin
from app.config import settings
from sqlalchemy.orm import Session
from fastapi import Depends

app = FastAPI(title="二手商品交易平台", version="1.0.0")


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(comments.router)
app.include_router(admin.router)

# Static files for uploads
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/categories")
def public_categories(db: Session = Depends(get_db)):
    return db.query(Category).order_by(Category.sort_order).all()
