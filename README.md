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

1. Backend (Render)

- Creez un service web Node.
- Variables d'environnement: `MONGO_URI`, `JWT_SECRET`, `FRONTEND_ORIGIN`, `NODE_ENV=production`.
- Commande de demarrage: `node src/server.js`.

2. Frontend (Vercel)

- Build: `next build`
- Start: `next start`
- Variable d'environnement: `NEXT_PUBLIC_API_URL` (URL du backend Render).

3. MongoDB Atlas

- Creez un cluster, recuperer l'URI et le placer dans `MONGO_URI`.

## PWA

- `frontend/public/manifest.json`
- `frontend/public/sw.js`
- Icônes dans `frontend/public/icons/`

Pour tester l'installation, lancez en HTTPS (Vercel ou tunnel) et utilisez le bouton "Installer l'app".
