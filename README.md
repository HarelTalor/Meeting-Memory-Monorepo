# 🛰️ Meeting Memory
> A high-performance, microservices-based workspace for capturing meetings, decisions, and tasks.

---

## ✨ Feature Highlights

*   **📅 Intelligent Calendar**: Seamlessly manage meetings with a powerful monthly and weekly view.
*   **👥 Participant Tracking**: Manage internal members and guest participants without complex user management.
*   **🏗️ Cascading Deletes**: Intelligent data integrity that cleans up tasks when meetings are removed.
*   **🔍 Unified Search**: Search through titles, summaries, and participant names with low-latency regex matching.
*   **⚡ Real-time Updates**: Real-time notifications for deadlines and status changes.
*   **🌗 Dark Mode**: Premium dark-mode aesthetics optimized for long-session productivity.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Angular 17, Signals, RxJS, Material 3, FullCalendar |
| **Backend** | Node.js, Express, Mongoose, Zod |
| **Architecture** | Nx Monorepo, Microservices, API Gateway |
| **Storage** | MongoDB, Redis (Pub/Sub) |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18+)
- **MongoDB** (running on `:27017`)
- **Docker** (optional, for easiest database setup)

### 2. Installation
```bash
npm install
```

### 3. Database Setup (Docker)
```bash
docker-compose up -d mongodb
```

### 4. Launch Development Environment
```bash
npx nx run-many -t serve -c development
```
-   **Frontend**: [http://localhost:4200](http://localhost:4200)
-   **API Gateway**: [http://localhost:3000](http://localhost:3000)

---

## 💾 How to Use the Database

-   **View Data**: Use [MongoDB Compass](https://www.mongodb.com/products/compass) to explore the data visually.
-   **Connection String**: `mongodb://localhost:27017`
-   **Collections**:
    -   `meetings`: Meeting metadata and decisions.
    -   `tasks`: To-do items linked to meetings.
    -   `users`: Authentication data.

---

## 📚 Documentation Deep-Dive

For detailed technical specs, explore the `docs` directory:
-   [Architecture Overview](./docs/architecture.md) — System diagrams and microservice breakdown.
-   [API Guide](./docs/api-guide.md) — Endpoint specifications and examples.
-   [Database Manual](./docs/database.md) — Schema details and tool recommendations.

---

## 🛑 Troubleshooting

-   **Zombie Processes**: If ports are blocked, run: `taskkill /F /IM node.exe` (Win) or `killall node` (Mac/Linux).
-   **Build Errors**: Run `npx nx reset` to clear cache if you encounter stale type errors.
