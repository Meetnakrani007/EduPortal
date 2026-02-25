# 📘 EduPortal

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)  
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)  
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)  
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)  
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)

EduPortal is a **student–faculty support portal** that enables students to raise academic queries, open support tickets, chat privately with teachers, and access helpful posts shared by the community.  
It’s built using **Node.js + Express.js + MongoDB**, with server-side rendered frontend (EJS/HTML). 🎓💻

👉 This project does **NOT use React**.

---

## Live Demo

## [Click here to view the live demo](https://eduportal-web.onrender.com) 🌐

---

## ✨ Features

- 🔐 **Authentication & Authorization** – Secure login/signup with JWT.
- 🎟️ **Support Ticket System** – Students can open tickets with category, teacher, and problem details.
- 💬 **Private Chat** – Student–teacher conversation within tickets.
- 📚 **Helpful Posts** – Teachers/students can publish posts visible to others.
- 📂 **File Uploads** – Attachments supported in tickets.
- 🖥️ **Role-Based Access** – Separate dashboards for students & teachers.
- ⏱️ **Status Tracking** – Teachers can update ticket status (Open, In Progress, Resolved).

---

## 🛠️ Tech Stack

- **Frontend**: Express.js (EJS), HTML, CSS, JavaScript  
- **Backend**: Node.js + Express.js 🚀  
- **Database**: MongoDB 🍃  
- **Authentication**: JWT (JSON Web Token) 🔑  
- **File Uploads**: Multer 📂  

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repo

```bash
git clone https://github.com/Meetnakrani007/EduPortal.git
cd EduPortal
```

### 2️⃣ Install dependencies

# For backend

```bash
npm install
```

# For frontend

```bash
cd client
npm install
```

### 3️⃣ Environment variables

```bash
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/eduportal
JWT_SECRET=your_jwt_secret_key_here
```

### 4️⃣ Run the project

# Backend

```bash
npm run dev
```

# Frontend

```bash
cd client
npm start
```
