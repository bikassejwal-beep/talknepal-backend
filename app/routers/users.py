from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional
import shutil, os, uuid
from app.services.database import db
from bson import ObjectId

router = APIRouter()

UPLOAD_DIR = "static/avatars"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# -------------------------
# Helper: safe user output
# -------------------------
def safe_user(user):
    return {
        "id": str(user["_id"]),
        "name": user.get("name"),
        "avatar": user.get("avatar"),
        "status_text": user.get("status_text"),
    }


# -------------------------
# Profile model
# -------------------------
class UpdateProfile(BaseModel):
    name: Optional[str] = None
    status_text: Optional[str] = None


# -------------------------
# GET PROFILE (SAFE)
# -------------------------
@router.get("/profile/{user_id}")
async def get_profile(user_id: str):
    user = await db.users.find_one({"_id": ObjectId(user_id)})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return safe_user(user)


# -------------------------
# UPDATE PROFILE
# -------------------------
@router.patch("/profile/{user_id}")
async def update_profile(user_id: str, req: UpdateProfile):
    update = {}

    if req.name:
        update["name"] = req.name
    if req.status_text:
        update["status_text"] = req.status_text

    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update}
    )

    return {"status": "updated"}


# -------------------------
# UPLOAD AVATAR
# -------------------------
@router.post("/avatar/{user_id}")
async def upload_avatar(user_id: str, file: UploadFile = File(...)):
    ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    path = os.path.join(UPLOAD_DIR, filename)

    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    avatar_url = f"/static/avatars/{filename}"

    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"avatar": avatar_url}}
    )

    return {"avatar_url": avatar_url}


# -------------------------
# SEARCH USERS (SAFE)
# -------------------------
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

    return {"users": [safe_user(u) for u in users]}


# -------------------------
# GET CONTACTS (SAFE)
# -------------------------
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
            result.append(safe_user(c))

    return {"contacts": result}


# -------------------------
# ADD CONTACT
# -------------------------
@router.post("/contacts/{user_id}/add/{contact_id}")
async def add_contact(user_id: str, contact_id: str):
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$addToSet": {"contacts": contact_id}}
    )

    return {"status": "contact added"}