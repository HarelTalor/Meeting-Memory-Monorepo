# Meeting Memory - Startup Manual 🚀

Meeting Memory is a powerful monorepo-based application for managing meetings, tracking decisions, and organizing tasks.

---

## 🛠 Prerequisites

Before you start, you need to download and install the following:

1.  **Node.js**: [Download and Install Node.js](https://nodejs.org/) (Recommended version: 18.x or 20.x).
2.  **MongoDB**:
    -   **Option A**: [Download MongoDB Community Server](https://www.mongodb.com/try/download/community) for local installation.
    -   **Option B (Recommended)**: Install [Docker](https://www.docker.com/) to run the database in a container.
3.  **Git**: [Download Git](https://git-scm.com/).
4.  **Nx Console (Optional but Recommended)**: A VS Code extension to manage the monorepo easily.

---

## 🚀 How to Start the Project

### 1. Clone the repository
```bash
git clone https://github.com/HarelTalor/Meeting-Memory-Monorepo.git
cd Meeting-Memory-Monorepo
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment
Ensure you have a `.env` file in the root directory (one is included in the repository for development).

### 4. Start the Database
If using Docker:
```bash
docker-compose up -d mongodb
```
Otherwise, ensure your local MongoDB service is running on `mongodb://localhost:27017`.

### 5. Launch the Application
Run the following command to start all microservices and the web frontend simultaneously:
```bash
npx nx run-many -t serve -c development
```
-   **Frontend**: `http://localhost:4200`
-   **API Gateway**: `http://localhost:3000`

---

## 💾 How to Use the Database

-   **View Data**: Use [MongoDB Compass](https://www.mongodb.com/products/compass) to explore the data visually.
-   **Connection String**: `mongodb://localhost:27017`
-   **Collections**:
    -   `meetings`: All meeting metadata, decisions, and guest participants.
    -   `tasks`: To-do items linked to meetings.
    -   `users`: Authentication data.

---

## 📚 Detailed Documentation

For more information, explore the `docs` folder:
-   [Architecture Overview](./docs/architecture.md)
-   [API Guide](./docs/api-guide.md)
-   [Database Manual](./docs/database.md)

---

## 🛑 Troubleshooting

-   **Zombie Processes**: If the server won't start because ports are "in use," run:
    `taskkill /F /IM node.exe` (Windows) or `killall node` (Linux/Mac).
-   **Search Issues**: If search returns nothing, ensure the `meeting-service` is running and MongoDB is connected.
