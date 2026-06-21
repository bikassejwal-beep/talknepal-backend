from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
import random, os
from app.services.database import db

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY", "talknepal-secret-key-change-in-production")
ALGORITHM = "HS256"

otp_store: dict = {}


class SignupRequest(BaseModel):
    name: str
    phone: str
    password: str


class LoginRequest(BaseModel):
    phone: str
    password: str


class OTPVerify(BaseModel):
    phone: str
    otp: str


def create_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(days=30)
    return jwt.encode({"sub": user_id, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/signup")
async def signup(req: SignupRequest):
    existing = await db.users.find_one({"phone": req.phone})
    if existing:
        raise HTTPException(status_code=400, detail="Phone already registered")

    hashed = pwd_context.hash(req.password)
    user = {
        "name": req.name,
        "phone": req.phone,
        "password": hashed,
        "avatar": "",
        "status_text": "Hey there! I am using TalkNepal",
        "created_at": datetime.utcnow(),
        "is_verified": False,
    }
    result = await db.users.insert_one(user)
    user_id = str(result.inserted_id)

    otp = str(random.randint(100000, 999999))
    otp_store[req.phone] = otp
    print(f"[OTP] {req.phone} -> {otp}")

    return {"message": "OTP sent to your phone", "user_id": user_id}


@router.post("/verify-otp")
async def verify_otp(req: OTPVerify):
    if otp_store.get(req.phone) != req.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    user = await db.users.find_one({"phone": req.phone})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.users.update_one({"phone": req.phone}, {"$set": {"is_verified": True}})
    del otp_store[req.phone]

    token = create_token(str(user["_id"]))
    return {"token": token, "user_id": str(user["_id"]), "name": user["name"]}


@router.post("/login")
async def login(req: LoginRequest):
    user = await db.users.find_one({"phone": req.phone})
    if not user or not pwd_context.verify(req.password, user["password"]):
        raise HTTPException(status_code=401, detail="Wrong phone or password")

    if not user.get("is_verified"):
        raise HTTPException(status_code=403, detail="Phone not verified. Please verify OTP first.")

    token = create_token(str(user["_id"]))
    return {
        "token": token,
        "user_id": str(user["_id"]),
        "name": user["name"],
        "avatar": user.get("avatar", ""),
    }


@router.post("/resend-otp")
async def resend_otp(phone: str):
    otp = str(random.randint(100000, 999999))
    otp_store[phone] = otp
    print(f"[OTP RESEND] {phone} -> {otp}")
    return {"message": "OTP resent"}
