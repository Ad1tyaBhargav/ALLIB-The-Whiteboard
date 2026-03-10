# 🧩 ALLIB - Real-Time Collaborative Whiteboard

**ALLIB** is a real-time collaborative whiteboard that brings people together on a shared canvas.
**Draw**, **write**, and **brainstorm** with others in live rooms where every change appears instantly.
Built to make idea sharing simple, interactive, and visual.
---

## 🚀 Features

### 🖌️ Drawing Tools

* ✨ Real-time collaborative drawing
* 🎨 Brush / drawing tool
* 🧹 Eraser tool
* 📝 Text tool
* 🎨 Color picker
* 📏 Adjustable brush size

### 👥 Collaboration

* 👥 Room-based collaboration
* 🧑‍🤝‍🧑 Up to 4 users per room
* ⚡ Live synchronization using Socket.IO

### 💾 Board Management

* 💾 Save board as image
* 📂 Import existing boards

### 👑 Admin Controls

* 👑 Host controls
* 🚫 Ban users from room
* 🦶 Kick users from room

### ⚡ Real-Time Engine

* 🔌 WebSocket communication using Socket.IO
* 🔄 Instant canvas updates for all users
* 📡 Event-based synchronization

---

## 🛠️ Tech Stack

### Frontend

* React.js
* HTML5 Canvas API
* Bootstrap / Tailwind CSS
* Socket.IO Client
* Context API

### Backend

* Node.js
* Express.js
* Socket.IO
* MongoDB & Mongoose
* JWT Authentication
* Multer 

---

## Project Structure

```
Server/   → APIs, sockets, database logic
my-app/  → UI components and client-side logic
```

### Frontend

```
my-app
│
├── public
├── dist
│
├── src
│   ├── assets
│   │
│   ├── components
│   │
│   ├── context
│   │
│   ├── App.jsx
│   ├── Homepage.jsx
│   ├── whiteboard.jsx
│   ├── socket.js
│   └── main.jsx
│
├── .env
├── index.html
├── vite.config.js
└── package.json
```

### Backend

```
Server
│
├── middleware
│   ├── auth.js
│   └── upload.js
│
├── models
│   ├── Room.js
│   └── User.js
│
├── Routes
│   ├── auth.js
│   ├── avatarupload.js
│   └── rooms.js
│
├── services
│   └── Server_Functions.js
│
├── Socket
│   └── socket events
│
├── utils
│
├── .env
├── index.js
└── package.json
```

---

## ⚙️ Local Setup

```bash
# Backend
cd Server
npm install
npm start

# Frontend
cd my-app
npm install
npm run dev
```

---

## .env setup

```
JWT_SECRET=your_secert
CLOUDINARY_NAME=your_CLOUDINARY_NAME
CLOUDINARY_KEY=your_CLOUDINARY_KEY
CLOUDINARY_SECRET=your_CLOUDINARY_SECRET
MONGODB_URI="mongodb://localhost:27017/Whiteboard"
```

---

## 📌 Future Improvements

* Advanced drawing tools
* Board history and versioning
* Performance optimizations
* Improved UI/UX

---

## 📬 Contact

**Aditya Bhargav**
Backend / Full-Stack Developer
* GitHub: [https://github.com/Ad1tyaBhargav](https://github.com/Ad1tyaBhargav)
* LinkedIn: [https://linkedin.com/in/aditya-bhargav](https://linkedin.com/in/aditya-bhargav)

---

⭐ If you find this project useful, consider giving it a star!
