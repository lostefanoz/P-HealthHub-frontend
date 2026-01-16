# PrivilegedHealthHub Frontend

## Overview
Single page application for PrivilegedHealthHub. Built with React and Vite, it consumes the backend REST API under `/api/v1` and uses HttpOnly cookies for authentication.

## Tech stack
- React 18
- Vite 7
- React Router
- React Query
- MUI and Bootstrap

## Requirements
- Node 18+ and npm

## Configuration
The API base URL is configured via `VITE_API_URL`. If not set, the app defaults to:
`http://<current-host>:8000/api/v1`

Example `.env`:
```
VITE_API_URL=http://127.0.0.1:8000/api/v1
```

## Development
```powershell
cd D:\P-HealthHub\frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5173`. Ensure the backend is running on port 8000.

## Production
Build the frontend:
```powershell
cd D:\P-HealthHub\frontend
npm run build
```

Output is generated in `dist/`.

Deployment options:
- Serve `dist/` from a static web server (nginx, S3, etc) and set `VITE_API_URL` to the API base URL.
- If the backend repo is a sibling and you want a single server, the backend will serve `../frontend/dist` automatically when present.

## Scripts
- `npm run dev`: start Vite dev server
- `npm run build`: production build
- `npm run preview`: local preview of the build

## API integration
- Axios client uses `withCredentials: true` to send cookies.
- Authentication uses HttpOnly cookies set by the backend.
- In production, use HTTPS and configure backend CORS accordingly.

## Testing
No automated frontend tests are configured in this repository.

## Troubleshooting
- CORS errors: update backend `CORS_ALLOW_ORIGINS` and confirm the frontend origin.
- 401 responses: verify login flow and cookie settings.
- Wrong API target: set `VITE_API_URL` and rebuild.

## License
All rights reserved.
