import os
import sys

# Override DATABASE_URL before importing app modules
os.environ["DATABASE_URL"] = "sqlite:///./test.db"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app

engine = create_engine("sqlite:///./test.db", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def _register(username="testuser", email="test@test.com", password="test123", role="user"):
    return client.post("/api/auth/register", json={
        "username": username, "email": email, "password": password, "role": role
    })


def _login(username="testuser", password="test123"):
    return client.post("/api/auth/login", json={"username": username, "password": password})


# --- Auth tests ---
def test_register_success():
    res = _register()
    assert res.status_code == 200
    assert res.json()["username"] == "testuser"


def test_register_duplicate_username():
    _register()
    res = _register()
    assert res.status_code == 400


def test_register_short_password():
    res = _register(password="12")
    assert res.status_code == 422


def test_login_success():
    _register()
    res = _login()
    assert res.status_code == 200
    assert "access_token" in res.json()


def test_login_wrong_password():
    _register()
    res = _login(password="wrong")
    assert res.status_code == 401


def test_get_me():
    _register()
    token = _login().json()["access_token"]
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["username"] == "testuser"


def test_get_me_unauthorized():
    res = client.get("/api/auth/me")
    assert res.status_code == 401


# --- Health test ---
def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200


# --- Categories tests ---
def test_public_categories():
    res = client.get("/api/categories")
    assert res.status_code == 200


# --- Product tests ---
def test_create_product_as_merchant():
    _register(username="merchant1", email="m@test.com", role="merchant")
    token = _login(username="merchant1").json()["access_token"]
    res = client.post("/api/products", json={
        "title": "测试商品", "price": 99.9, "description": "测试描述"
    }, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["title"] == "测试商品"


def test_create_product_as_user_forbidden():
    _register()
    token = _login().json()["access_token"]
    res = client.post("/api/products", json={
        "title": "测试商品", "price": 99.9
    }, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403


def test_list_products():
    res = client.get("/api/products")
    assert res.status_code == 200
