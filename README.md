# CodeCast - Collaborative Real-Time Code Editor

CodeCast is a modern, responsive, real-time collaborative code editing web application designed for learning, technical pair programming, peer collaboration, and rapid hackathon prototyping. It features Monaco Editor integration, live sandboxed web previews, a dynamic file/folder hierarchy, and instant Socket.io room synchronization.

A full-stack collaborative web application built with **React**, **Vite**, **Tailwind CSS**, **Monaco Editor**, **Node.js**, **Express.js**, **Socket.io**, and **MongoDB Atlas**.

---

## 👥 Project Team & Contributions

CodeCast was developed as a collaborative team project by **2 team members**:

- **Kumar Shaurya**: Developed the entire frontend single-page application (HTML, CSS, JavaScript, React components), integrated the Monaco Editor and Live Sandbox preview components, designed the dynamic file tree explorer, and connected MongoDB Atlas database integration.
- **Veerendra Kumar**: Developed backend API architecture, database schema models (User & Workspace), JWT authentication middleware, Socket.io WebSocket listeners, and database seed configuration.

---

## 🚀 Features

### 1. Real-Time Code Synchronization & Multi-User Rooms (Most Important Feature)

CodeCast enables multiple developers to edit code simultaneously in shared collaboration rooms.

- Users can create or join dedicated rooms using a unique **Room ID**.
- Every code change, file creation, or file deletion is broadcast instantly to all connected users in the room using Socket.io WebSockets.
- Displays live online status and user roles (Admin, User, Guest) for all connected participants in real time.

### 2. VS Code Monaco Editor Integration

CodeCast incorporates the VS Code core editing engine directly into the browser environment.

- Supports syntax highlighting for multiple programming languages including HTML, CSS, JavaScript, Python, Java, C++, JSON, and Markdown.
- Features line numbering, code indentation, auto-closing brackets, and language auto-detection.

### 3. Live Sandbox Web Preview

CodeCast includes an integrated live preview panel that automatically renders web projects without build delays.

- Automatically compiles `index.html`, `style.css`, and `script.js` into an isolated iframe sandbox.
- Updates live in real time as team members edit code.

### 4. Dynamic File & Folder Hierarchy

CodeCast provides a full file management system to organize code projects into clean folder structures.

- Supports creating, nesting, and deleting files and folders dynamically.
- Automatically pre-configures new workspaces with standard web starter files (`index.html`, `style.css`, `script.js`) to eliminate project setup friction for hackathons.

### 5. One-Click ZIP Export

CodeCast allows users to export complete workspace project structures with a single click.

- Uses `JSZip` to package all files and nested folder hierarchies into a standard `.zip` archive ready for local execution or offline backup.

### 6. User Authentication & Data Persistence

CodeCast offers both registered user accounts and instant guest access:

- Registered users log in via **JWT-authenticated** accounts to create, manage, and persist workspaces in **MongoDB Atlas**.
- Guests can join existing collaboration rooms using a shared Room ID without registration.
- Periodically auto-saves file modifications back to MongoDB Atlas.

---

## 🛠️ Technology Stack

| Component | Technology |
| :--- | :--- |
| **Frontend Framework** | [React](https://react.dev/) + [Vite](https://vitejs.dev/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) |
| **Code Editor Engine** | [Monaco Editor](https://microsoft.github.io/monaco-editor/) |
| **Backend Runtime** | [Node.js](https://nodejs.org/) + [Express.js](https://expressjs.com/) |
| **Real-time Engine** | [Socket.io](https://socket.io/) (WebSockets) |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/atlas) + [Mongoose](https://mongoosejs.com/) |
| **Authentication** | [JSON Web Tokens (JWT)](https://jwt.io/) + [bcryptjs](https://www.npmjs.com/package/bcryptjs) |
| **Project Packaging** | [JSZip](https://stuk.github.io/jszip/) |

---

## 📁 Folder Structure

* **`client/`**: Frontend React single-page application, Vite build config, Monaco Editor integration, and Tailwind styling.
* **`server/`**: Backend REST API routes, Socket.io event handlers, Mongoose schemas, and JWT middleware.
* **`docs/`**: Technical preparation guides, database schemas, and WebSocket protocol definitions.

---

## 🛠️ Step-by-Step Run Instructions

### Step 1: Clone & Open the Repository
```bash
git clone https://github.com/StrangeRider/CodeCast.git
cd CodeCast
```

### Step 2: Install Dependencies
Run this single command at the root folder to automatically install packages for both the client (frontend) and server (backend):
```bash
npm run install:all
```

### Step 3: Configure Environment Variables
Create a file named `.env` in the root folder of the project and paste the following configuration:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/codecast
JWT_SECRET=your_jwt_secret_key_here
```

### Step 4: Run the Application

Choose **Option A** for development, or **Option B** for production deployment:

#### Option A: Running in Development Mode (Recommended)
Runs frontend and backend concurrently with hot-reloads enabled:

1. **Start the Backend Server**:
   ```bash
   npm run dev:server
   ```
2. **Start the Frontend Client**:
   ```bash
   npm run dev:client
   ```
3. Open your browser to **`http://localhost:3000`**.

#### Option B: Running in Production Mode
Compiles frontend code and serves it directly through the Node server:

```bash
npm run build:client
npm start
```
Open your browser to **`http://localhost:5000`**.
