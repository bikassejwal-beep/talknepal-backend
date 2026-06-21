# TalkNepal — Chat, Call & Status App (Python Backend)

## Features
- User signup/login with OTP verification
- Real-time chat via WebSocket
- Audio & Video call signaling (WebRTC)
- WhatsApp-style 24hr Status/Stories
- Media file upload (images, videos, documents)
- User profile with avatar
- Contact management
- Unread message count
- Online/offline status

---

## Project Structure
```
talknepal/
├── app/
│   ├── main.py              # FastAPI app + WebSocket
│   ├── routers/
│   │   ├── auth.py          # Signup, Login, OTP
│   │   ├── chat.py          # Messages, Media upload
│   │   ├── call.py          # Call logs
│   │   ├── status.py        # Stories/Status
│   │   └── users.py         # Profile, Search, Contacts
│   └── services/
│       ├── database.py      # MongoDB connection
│       └── connection_manager.py  # WebSocket manager
├── static/                  # Uploaded files
├── requirements.txt
└── .env.example
```

---

## Setup

### 1. Install Python 3.10+

### 2. Install MongoDB
Download from https://www.mongodb.com/try/download/community

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Create .env file
```bash
cp .env.example .env
# Edit .env and change SECRET_KEY
```

### 5. Run the server
```bash
python -m app.main
```

Server starts at: http://localhost:8000

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | Register new user |
| POST | /api/auth/verify-otp | Verify OTP |
| POST | /api/auth/login | Login |
| POST | /api/auth/resend-otp | Resend OTP |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/chat/send | Send message |
| GET | /api/chat/history/{user1}/{user2} | Chat history |
| POST | /api/chat/upload-media | Upload image/video/file |
| PATCH | /api/chat/read/{from}/{to} | Mark as read |
| DELETE | /api/chat/message/{id} | Delete message |
| GET | /api/chat/unread-count/{user_id} | Unread counts |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users/profile/{user_id} | Get profile |
| PATCH | /api/users/profile/{user_id} | Update name/status |
| POST | /api/users/avatar/{user_id} | Upload avatar |
| GET | /api/users/search?phone=98... | Search by phone |
| GET | /api/users/contacts/{user_id} | Get contacts |
| POST | /api/users/contacts/{id}/add/{contact_id} | Add contact |

### Status
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/status/text | Post text status |
| POST | /api/status/media | Post photo/video status |
| GET | /api/status/feed/{user_id} | Get status feed |
| POST | /api/status/view/{status_id} | Mark as viewed |
| DELETE | /api/status/{status_id} | Delete status |

### Calls
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/call/log | Save call log |
| GET | /api/call/history/{user_id} | Call history |

---

## WebSocket — Real-time Events

Connect: `ws://localhost:8000/ws/{user_id}`

### Send from client:
```json
// Chat message
{"type": "chat_message", "to": "user_id", "message": "Hello!", "timestamp": "..."}

// Start call
{"type": "call_offer", "to": "user_id", "call_type": "video", "data": "<webrtc_offer>"}

// Answer call
{"type": "call_answer", "to": "user_id", "data": "<webrtc_answer>"}

// ICE candidates (WebRTC)
{"type": "ice_candidate", "to": "user_id", "data": "<candidate>"}

// End call
{"type": "call_end", "to": "user_id"}

// Typing indicator
{"type": "typing", "to": "user_id", "is_typing": true}
```

### Receive on client:
Same types as above plus:
```json
// Online/offline
{"type": "user_status", "user_id": "...", "status": "online"}
```

---

## Deploy (Public Access)

### Option 1: Railway.app (Free)
1. Push code to GitHub
2. Go to https://railway.app
3. Connect GitHub repo
4. Add MongoDB plugin
5. Set SECRET_KEY in environment variables
6. Deploy!

### Option 2: Render.com (Free)
1. Push to GitHub
2. New Web Service on render.com
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add MongoDB Atlas connection string

### Option 3: VPS (DigitalOcean / Linode)
```bash
# Install nginx + supervisor
# Point domain to server
# Use Let's Encrypt for HTTPS
```

---

## Frontend (Mobile App)

For the React Native frontend to connect to this backend:

```javascript
// WebSocket
const ws = new WebSocket('ws://your-server.com/ws/' + userId);

// API calls
const API = 'https://your-server.com/api';
fetch(API + '/auth/login', { method: 'POST', body: JSON.stringify({...}) })
```

### Video/Audio Calls (WebRTC)
The backend only handles **signaling** (offer/answer/ICE exchange via WebSocket).
Actual audio/video streams go **peer-to-peer** between devices using WebRTC.
Use a STUN server: `stun:stun.l.google.com:19302`

---

## Notes
- OTP is printed to console (add SMS gateway like Sparrow SMS for Nepal)
- Max file upload: 16MB
- Status expires after 24 hours automatically
- For production, use MongoDB Atlas instead of local MongoDB
