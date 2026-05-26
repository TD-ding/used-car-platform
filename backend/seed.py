"""Seed the database with default admin, merchant accounts and categories."""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app.models import User, Category
from app.auth import hash_password


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Default users
    defaults = [
        {"username": "admin", "email": "admin@usedmarket.com", "password": "admin123", "role": "admin"},
        {"username": "merchant", "email": "merchant@usedmarket.com", "password": "merchant123", "role": "merchant"},
    ]
    for d in defaults:
        if not db.query(User).filter(User.username == d["username"]).first():
            user = User(
                username=d["username"],
                email=d["email"],
                hashed_password=hash_password(d["password"]),
                role=d["role"],
            )
            db.add(user)

    # Default categories
    categories = [
        {"name": "数码电子", "sort_order": 1},
        {"name": "图书教材", "sort_order": 2},
        {"name": "服饰鞋包", "sort_order": 3},
        {"name": "生活用品", "sort_order": 4},
        {"name": "运动户外", "sort_order": 5},
        {"name": "美妆护肤", "sort_order": 6},
        {"name": "其他", "sort_order": 99},
    ]
    for cat in categories:
        if not db.query(Category).filter(Category.name == cat["name"]).first():
            db.add(Category(**cat))

    db.commit()
    db.close()
    print("Database seeded successfully!")


if __name__ == "__main__":
    seed()
