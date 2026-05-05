# API Guide

The Meeting Memory system exposes several microservices via an API Gateway. All requests must be authenticated using a Bearer Token.

## API Gateway
- **URL**: `http://localhost:3000`
- **Internal Routing**:
  - `/api/auth/*` -> Proxies to Auth Service (Port 3001)
  - `/api/meetings/*` -> Proxies to Meeting Service (Port 3002)
  - `/api/tasks/*` -> Proxies to Task Service (Port 3003)
  - `/api/notifications/*` -> Proxies to Notification Service (Port 3004)

## Common Endpoints

### Authentication
- `POST /api/auth/register`: Register a new user.
- `POST /api/auth/login`: Login and receive a JWT.

### Meetings
- `GET /api/meetings`: List meetings (supports `search`, `status`, `dateFrom`, `dateTo`).
- `POST /api/meetings`: Create a new meeting.
- `GET /api/meetings/:id`: Get detailed meeting info.
- `PATCH /api/meetings/:id`: Update meeting details.
- `DELETE /api/meetings/:id`: Delete meeting (includes cascading delete for tasks).

### Tasks
- `GET /api/tasks`: List tasks.
- `POST /api/tasks`: Create a new task.
- `PATCH /api/tasks/:id`: Update task status or info.
- `DELETE /api/tasks/:id`: Remove a task.

## Error Handling
The API follows the **Problem Details for HTTP APIs (RFC 7807)** standard. Errors return a JSON object with:
- `type`: Error category URI.
- `title`: Short human-readable summary.
- `status`: HTTP status code.
- `detail`: Explanation specific to this occurrence.
