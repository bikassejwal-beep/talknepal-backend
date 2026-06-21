from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional
import shutil, os, uuid
from app.services.database import db

router = APIRouter()
UPLOAD_DIR = "static/status"
os.makedirs(UPLOAD_DIR, exist_ok=True)


class TextStatus(BaseModel):
    user_id: str
    text: str
    bg_color: str = "#6c63ff"
    font_style: str = "normal"


@router.post("/text")
async def post_text_status(req: TextStatus):
    status = {
        "user_id": req.user_id,
        "type": "text",
        "content": req.text,
        "bg_color": req.bg_color,
        "font_style": req.font_style,
        "views": [],
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(hours=24),
    }
    result = await db.statuses.insert_one(status)
    return {"status_id": str(result.inserted_id)}


@router.post("/media")
async def post_media_status(user_id: str, file: UploadFile = File(...), caption: Optional[str] = ""):
    ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    path = os.path.join(UPLOAD_DIR, filename)

    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    media_type = "video" if ext in ["mp4", "mov", "avi"] else "image"

    status = {
        "user_id": user_id,
        "type": media_type,
        "media_url": f"/static/status/{filename}",
        "caption": caption,
        "views": [],
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(hours=24),
    }
    result = await db.statuses.insert_one(status)
    return {"status_id": str(result.inserted_id)}


@router.get("/feed/{user_id}")
async def get_status_feed(user_id: str):
    now = datetime.utcnow()
    statuses = await db.statuses.find({
        "expires_at": {"$gt": now}
    }).sort("created_at", -1).to_list(length=200)

    for s in statuses:
        s["_id"] = str(s["_id"])
        s["created_at"] = s["created_at"].isoformat()
        s["expires_at"] = s["expires_at"].isoformat()
        s["view_count"] = len(s.get("views", []))
        s["viewed_by_me"] = user_id in s.get("views", [])

    return {"statuses": statuses}


@router.post("/view/{status_id}")
async def view_status(status_id: str, viewer_id: str):
    from bson import ObjectId
    await db.statuses.update_one(
        {"_id": ObjectId(status_id)},
        {"$addToSet": {"views": viewer_id}}
    )
    return {"status": "viewed"}


@router.delete("/{status_id}")
async def delete_status(status_id: str):
    from bson import ObjectId
    await db.statuses.delete_one({"_id": ObjectId(status_id)})
    return {"status": "deleted"}
