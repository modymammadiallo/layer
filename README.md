# SmartTasks

Application de gestion de taches PWA (Next.js + Express + MongoDB).

## Prerequis

- Node.js 18+
- MongoDB local ou Atlas

## Installation locale

1. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Ouvrez http://localhost:3000

## Deploiement

### Render (backend + frontend)

Le repo contient un blueprint `render.yaml` qui cree 2 services web:

- `smarttasks-backend` (Express API)
- `smarttasks-frontend` (Next.js)

Etapes:

1. Push du repo sur GitHub.
2. Dans Render: New + > Blueprint > selectionnez ce repo.
3. Dans les variables `sync: false`, renseignez:
   - Backend: `MONGO_URI`, `FRONTEND_ORIGIN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
   - Frontend: `NEXT_PUBLIC_API_URL` (URL publique du backend Render, ex: `https://smarttasks-backend.onrender.com`)
4. Verifiez que `FRONTEND_ORIGIN` contient l'URL du frontend Render (ex: `https://smarttasks-frontend.onrender.com`).
5. Lancez le deploy.

Notes:

- `JWT_SECRET` est genere automatiquement par Render via `generateValue`.
- `COOKIE_SAMESITE=none` est configure pour compatibilite cross-domain en production (HTTPS requis).
- `ADMIN_FORCE_RESET=false` evite de reinitialiser le mot de passe admin a chaque redeploy.

## PWA

- `frontend/public/manifest.json`
- `frontend/public/sw.js`
- Icones dans `frontend/public/icons/`

Pour tester l'installation, lancez en HTTPS (Render) et utilisez le bouton "Installer l'app".
