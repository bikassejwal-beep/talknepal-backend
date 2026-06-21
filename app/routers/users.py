from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional
import shutil, os, uuid
from app.services.database import db
from bson import ObjectId

router = APIRouter()
UPLOAD_DIR = "static/avatars"
os.makedirs(UPLOAD_DIR, exist_ok=True)


class UpdateProfile(BaseModel):
    name: Optional[str] = None
    status_text: Optional[str] = None


@router.get("/profile/{user_id}")
async def get_profile(user_id: str):
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["_id"] = str(user["_id"])
    user.pop("password", None)
    return user


@router.patch("/profile/{user_id}")
async def update_profile(user_id: str, req: UpdateProfile):
    update = {}
    if req.name:
        update["name"] = req.name
    if req.status_text:
        update["status_text"] = req.status_text
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update})
    return {"status": "updated"}


@router.post("/avatar/{user_id}")
async def upload_avatar(user_id: str, file: UploadFile = File(...)):
    ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    path = os.path.join(UPLOAD_DIR, filename)
    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    avatar_url = f"/static/avatars/{filename}"
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"avatar": avatar_url}})
    return {"avatar_url": avatar_url}


@router.get("/search")
async def search_users(phone: str = "", name: str = ""):
    query = {}
    if phone:
        query["phone"] = {"$regex": phone, "$options": "i"}
    elif name:
        query["name"] = {"$regex": name, "$options": "i"}
    else:
        return {"users": []}

    users = await db.users.find(query).limit(20).to_list(length=20)
    for u in users:
        u["_id"] = str(u["_id"])
        u.pop("password", None)
    return {"users": users}


@router.get("/contacts/{user_id}")
async def get_contacts(user_id: str):
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    contacts = user.get("contacts", [])
    result = []
    for cid in contacts:
        c = await db.users.find_one({"_id": ObjectId(cid)})
        if c:
            c["_id"] = str(c["_id"])
            c.pop("password", None)
            result.append(c)
    return {"contacts": result}


@router.post("/contacts/{user_id}/add/{contact_id}")
async def add_contact(user_id: str, contact_id: str):
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$addToSet": {"contacts": contact_id}}
    )
    return {"status": "contact added"}
