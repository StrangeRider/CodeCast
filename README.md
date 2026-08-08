# CodeCast (Portfolio Project)

A simple, real-time collaborative code editor built for learning, easy interview explanation, and clean, readable code. It features Monaco Editor integrations, live sandboxed previews, a flat-tree file explorer, and Socket.io room synchronization.

---

## 🚀 Tech Stack

*   **Frontend**: React, Vite, Tailwind CSS, Monaco Editor, Socket.io Client, Axios
*   **Backend**: Node.js, Express.js, Socket.io, JWT Authentication, Mongoose
*   **Database**: MongoDB Atlas

---

## 📁 Folder Structure

*   **`client/`**: Contains all frontend single-page application code, Vite configurations, and styles.
*   **`server/`**: Contains all backend API logic, schemas, JWT middleware, and WebSockets listeners.
*   **`docs/`**: Contains extensive interview-preparation guides, DB schema drawings, and WebSocket protocol definitions.

---

## 🛠️ Step-by-Step Run Instructions

### Step 1: Open the Project
1.  Clone the repository or open the project folder in your code editor (like VS Code).
2.  Open your command line terminal in this folder.

### Step 2: Install Dependencies
Run this single command at the root folder to automatically install all packages for both the client (frontend) and server (backend):
```bash
npm run install:all
```

### Step 3: Configure Environment Variables
Create a file named `.env` in the root folder of the project and paste the following configuration:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<your_username>:<your_password>@<your_cluster>.mongodb.net/codecast
JWT_SECRET=your_jwt_secret_key_here
```

### Step 4: Run the Application
Choose **Option A** for development, or **Option B** for production deployment:

#### Option A: Running in Development Mode (Recommended)
This runs the frontend and backend concurrently with live hot-reloads enabled.
1.  **Open Terminal 1** and start the backend database/socket server:
    ```bash
    npm run dev:server
    ```
    *(The backend will start and log: `Server running on port 5000` & `MongoDB Connected successfully`)*
2.  **Open Terminal 2** and start the frontend client:
    ```bash
    npm run dev:client
    ```
    *(The frontend dev server will launch at `http://localhost:3000`)*
3.  **Open your browser** to: **`http://localhost:3000`**

#### Option B: Running in Production Mode
This compiles the frontend code and serves it directly through a single port on the Node server.
1.  In your terminal, build the client and start the production server:
    ```bash
    npm run build:client
    npm start
    ```
2.  **Open your browser** to: **`http://localhost:5000`**
