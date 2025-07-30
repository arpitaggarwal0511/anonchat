# 🗣️ AnonChat

A real-time anonymous chat application built with **Next.js**, **Node.js**, **Socket.IO**, and optionally **MongoDB** for message persistence.

**Live Demo:** [anon-chat-frontend.vercel.app](https://anon-chat-frontend.vercel.app)

---

## 🚀 Features

- 🔒 Anonymous chat with randomly assigned usernames
- 💬 Real-time messaging via WebSockets
- 🧠 In-memory room storage (MongoDB optional)
- 🌐 Join chat rooms via unique room URLs
- 🔁 Smooth auto-scrolling and input UX
- 🧹 Clean socket lifecycle handling

---

## 🛠️ Tech Stack

### Frontend:
- [Next.js](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- TailwindCSS
- Socket.IO Client

### Backend:
- Node.js (Express)
- Socket.IO
- CORS
- (Optional) MongoDB via `mongodb` npm driver

---
## ⚙️ Setup & Run Locally

### 1. Clone the repo

```bash
git clone https://github.com/arpitaggarwal0511/anonchat
cd anonchat
cd chat-server
npm install

# Without DB:
node index.js

# With MongoDB (Optional)
# Set MONGO_URI and DB_NAME in a `.env` file
node index.js

# Start Frontend
cd ../anonymous-chat-app
npm install
npm run dev
