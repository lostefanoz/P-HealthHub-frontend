# PrivilegedHealthHub Frontend

## Panoramica
Single page application per PrivilegedHealthHub. Costruita con React e Vite, consuma la REST API del backend sotto `/api/v1` e usa cookie HttpOnly per l'autenticazione.

## Stack tecnico
- React 18
- Vite 7
- React Router
- React Query
- MUI e Bootstrap

## Requisiti
- Node 18+ e npm

## Configurazione
La base URL della API si imposta con `VITE_API_URL`. Se non configurata, il valore predefinito &egrave;:
`http://<current-host>:8000/api/v1`

Esempio `.env`:
```
VITE_API_URL=http://127.0.0.1:8000/api/v1
```

## Sviluppo
```powershell
cd D:\P-HealthHub\frontend
npm install
npm run dev
```

Apri `http://127.0.0.1:5173`. Assicurati che il backend sia in esecuzione sulla porta 8000.

## Produzione
Compila il frontend:
```powershell
cd D:\P-HealthHub\frontend
npm run build
```

L'output viene generato in `dist/`.

Opzioni di deploy:
- Servi `dist/` con un web server statico (nginx, S3, ecc) e imposta `VITE_API_URL` con la base URL della API.
- Se il backend &egrave; un progetto sibling e vuoi un solo server, il backend serve automaticamente `../frontend/dist` quando presente. In questo caso usa `VITE_API_URL=/api/v1` e ricompila la build.

## Script
- `npm run dev`: avvia il dev server Vite
- `npm run build`: build di produzione
- `npm run preview`: preview locale della build

## Integrazione API
- Il client Axios usa `withCredentials: true` per inviare i cookie.
- L'autenticazione usa cookie HttpOnly impostati dal backend.
- In produzione, usa HTTPS e configura il CORS del backend.

## Test
Non sono configurati test automatici frontend in questo repository.

## Risoluzione problemi
- Errori CORS: aggiorna `CORS_ALLOW_ORIGINS` nel backend e verifica l'origine del frontend.
- Risposte 401: verifica il flusso di login e le impostazioni dei cookie.
- Target API errato: imposta `VITE_API_URL` e ricompila.

## Licenza
Tutti i diritti riservati.
