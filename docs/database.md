# Database Manual

The project uses **MongoDB** as its primary data store. Each microservice typically connects to its own database (or collection) to ensure loose coupling.

## How to Start the Database

### Option 1: Docker (Recommended)
The easiest way to run the database is via the provided `docker-compose.yml` file.
```bash
docker-compose up -d mongodb
```

### Option 2: Local Installation
If you have MongoDB installed locally, ensure it is running on port `27017` (the default).

## How to See Data in the DB

### 1. MongoDB Compass (GUI)
1. Download and install [MongoDB Compass](https://www.mongodb.com/products/compass).
2. Connect using the URI: `mongodb://localhost:27017`
3. You will see databases like `meeting-memory`, `auth-db`, etc.

### 2. VS Code Extension
Install the **MongoDB for VS Code** extension to browse collections and documents directly in your editor.

### 3. Mongo Shell (CLI)
```bash
mongosh "mongodb://localhost:27017"
> show dbs
> use meeting-memory
> db.meetings.find().pretty()
```

## Database Schema
The database schemas are enforced at the application level using **Mongoose** (Backend) and validated via **Zod** (Shared). 

- **Meetings**: Stored in `meetings` collection.
- **Tasks**: Stored in `tasks` collection.
- **Users**: Stored in `users` collection.
