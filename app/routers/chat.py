from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
import shutil, os, uuid
from app.services.database import db
from app.routers.auth import SECRET_KEY, ALGORITHM
from jose import jwt

router = APIRouter()
UPLOAD_DIR = "static/media"
os.makedirs(UPLOAD_DIR, exist_ok=True)


class MessageRequest(BaseModel):
    from_user: str
    to_user: str
    message: str
    media_url: Optional[str] = None
    message_type: str = "text"


def get_user_id(token: str) -> str:
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    return payload.get("sub")


@router.post("/send")
async def send_message(req: MessageRequest):
    msg = {
        "from_user": req.from_user,
        "to_user": req.to_user,
        "message": req.message,
        "media_url": req.media_url,
        "message_type": req.message_type,
        "timestamp": datetime.utcnow(),
        "is_read": False,
        "is_deleted": False,
    }
    result = await db.messages.insert_one(msg)
    return {"message_id": str(result.inserted_id), "status": "sent"}


@router.get("/history/{user1}/{user2}")
async def get_chat_history(user1: str, user2: str, limit: int = 50):
    messages = await db.messages.find({
        "$or": [
            {"from_user": user1, "to_user": user2},
            {"from_user": user2, "to_user": user1},
        ],
        "is_deleted": False
    }).sort("timestamp", -1).limit(limit).to_list(length=limit)

    for m in messages:
        m["_id"] = str(m["_id"])
        m["timestamp"] = m["timestamp"].isoformat()

    return {"messages": list(reversed(messages))}


@router.delete("/message/{message_id}")
async def delete_message(message_id: str, for_everyone: bool = False):
    from bson import ObjectId
    if for_everyone:
        await db.messages.update_one(
            {"_id": ObjectId(message_id)},
            {"$set": {"is_deleted": True, "message": "This message was deleted"}}
        )
    else:
        await db.messages.update_one(
            {"_id": ObjectId(message_id)},
            {"$set": {"deleted_for_sender": True}}
        )
    return {"status": "deleted"}


@router.post("/upload-media")
async def upload_media(file: UploadFile = File(...)):
    ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    path = os.path.join(UPLOAD_DIR, filename)

    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size_mb = os.path.getsize(path) / (1024 * 1024)
    if file_size_mb > 16:
        os.remove(path)
        raise HTTPException(status_code=400, detail="File too large. Max 16MB allowed.")

    return {"media_url": f"/static/media/{filename}", "filename": filename}


@router.patch("/read/{from_user}/{to_user}")
async def mark_as_read(from_user: str, to_user: str):
    await db.messages.update_many(
        {"from_user": from_user, "to_user": to_user, "is_read": False},
        {"$set": {"is_read": True}}
    )
    return {"status": "marked as read"}


@router.get("/unread-count/{user_id}")
async def unread_count(user_id: str):
    pipeline = [
        {"$match": {"to_user": user_id, "is_read": False}},
        {"$group": {"_id": "$from_user", "count": {"$sum": 1}}}
    ]
    result = await db.messages.aggregate(pipeline).to_list(length=100)
    return {"unread": {r["_id"]: r["count"] for r in result}}
