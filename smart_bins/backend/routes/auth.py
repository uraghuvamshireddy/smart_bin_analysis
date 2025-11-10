from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User
from schemas import UserCreate, LoginRequest, UserOut
from auth import require_admin
import auth

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register", response_model=UserOut)
def register(user: UserCreate, db: Session = Depends(get_db)):
    exists = db.query(User).filter(User.username == user.username).first()
    if exists:
        raise HTTPException(400, "Username already exists")

    hashed_pw = auth.hash_password(user.password)
    new_user = User(username=user.username, password=hashed_pw, role=user.role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()

    if not user or not auth.verify_password(data.password, user.password):
        raise HTTPException(401, "Invalid username/password")

    token = auth.create_token({"user_id": user.id, "role": user.role})
    return {"token": token, "role": user.role}

@router.get("/users")
def get_users(db: Session = Depends(get_db),dependencies=[Depends(require_admin)]):
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "role": u.role
        }
        for u in users
    ]