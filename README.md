# 🗣️ AnonChat

A real-time anonymous chat application built with **Next.js**, **Node.js**, **Socket.IO**, and optionally **MongoDB** for message persistence.

**Live Demo:** [anon-chat-frontend.vercel.app](https://anonchat-mocha.vercel.app/)

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
# Clone the repo
git clone https://github.com/arpitaggarwal0511/anonchat
cd anonchat

# Start Backend
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
```
## 🌐 Deployment

### 🚀 Frontend (Vercel)
1. Push the `anonymous-chat-app` (frontend) folder to GitHub.
2. Go to [vercel.com](https://vercel.com) and import your GitHub repo.
3. Set the environment variable:

```env
NEXT_PUBLIC_SOCKET_URL=https://your-backend-url.onrender.com
```

---

### ⚙️ Backend (Render)
1. Push the `chat-server` folder (backend) to GitHub.
2. Go to [render.com](https://render.com) and create a new **Web Service**.
3. Set build command:  
   ```
   npm install
   ```
   and start command:  
   ```
   node index.js
   ```
4. Set your **Node Version** to 16 or higher in Render settings.
5. If using MongoDB, add these environment variables:

```env
MONGO_URI=your_mongo_connection_string
DB_NAME=chatapp
```

---

## 💡 Future Improvements

- ✅ Add persistent DB storage (MongoDB)
- 🔒 Improve user identity/privacy
- 💬 Typing indicators
- 🗑️ Auto-clean empty/inactive rooms
- 📱 Mobile responsive improvements

---

## 🤝 Contributing

1. Fork the repo
2. Create your feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add your feature"
   ```
4. Push to your branch:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a Pull Request 🚀

---

## 📄 License

**MIT** © Arpit Aggarwal  
GitHub: [@arpitaggarwal0511](https://github.com/arpitaggarwal0511)

