from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.services.database import db

router = APIRouter()


class CallLog(BaseModel):
    caller_id: str
    receiver_id: str
    call_type: str  # "audio" or "video"
    status: str     # "completed", "missed", "rejected"
    duration_seconds: Optional[int] = 0


@router.post("/log")
async def log_call(req: CallLog):
    log = {
        "caller_id": req.caller_id,
        "receiver_id": req.receiver_id,
        "call_type": req.call_type,
        "status": req.status,
        "duration_seconds": req.duration_seconds,
        "timestamp": datetime.utcnow(),
    }
    result = await db.call_logs.insert_one(log)
    return {"log_id": str(result.inserted_id)}


@router.get("/history/{user_id}")
async def call_history(user_id: str, limit: int = 30):
    logs = await db.call_logs.find({
        "$or": [{"caller_id": user_id}, {"receiver_id": user_id}]
    }).sort("timestamp", -1).limit(limit).to_list(length=limit)

    for log in logs:
        log["_id"] = str(log["_id"])
        log["timestamp"] = log["timestamp"].isoformat()

    return {"calls": logs}
