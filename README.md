# API Rest N8N Rivaldo

Projet séparé en deux applications:

- `api-rest-backend` pour l'API Node.js / Express
- `api-rest-frontend` pour l'interface React / Vite

Le backend utilise un stockage JSON local et génère une `apiKey` par aliment.

Le dépôt racine fonctionne aussi comme workspace npm pour lancer les deux apps depuis la racine.

## Structure

- `api-rest-backend/`
  - `server.js`
  - `routers/foods.js`
  - `middlewares/apiKey.js`
  - `db/foodsStore.js`
  - `data/foods.json`
  - `postman/`
- `api-rest-frontend/`
  - `src/App.jsx`
  - `src/api.js`

## Prérequis

- Node.js 18+
- npm
- Postman pour les tests API

## Installation

Depuis la racine du dépôt:

```bash
npm install
```

Ou seulement les espaces de travail:

```bash
npm run install:all
```

Backend:

```bash
cd api-rest-backend
npm install
```

Frontend:

```bash
cd api-rest-frontend
npm install
```

## Variables d'environnement

Backend: [api-rest-backend/.env](api-rest-backend/.env)

```env
API_KEY=change_me_to_match_backend
PORT=3000
```

Frontend: [api-rest-frontend/.env.local](api-rest-frontend/.env.local)

```env
VITE_API_URL=http://localhost:3000/api
VITE_API_KEY=change_me_to_match_backend
```

## Lancer le projet

Depuis la racine:

```bash
npm run dev:backend
npm run dev:frontend
```

Backend:

```bash
cd api-rest-backend
npm run dev
```

Frontend:

```bash
cd api-rest-frontend
npm run dev
```

## API

- `GET /api/foods`
- `POST /api/foods`
- `PUT /api/foods/:id`
- `DELETE /api/foods/:id`
- `GET /api/foods/:id/api-key`

Header requis:

- `x-api-key: <valeur>`

Pour afficher temporairement la clé dans la liste, le frontend demande:

- `GET /api/foods?includeApiKey=true`

## Postman

Importer les fichiers suivants:

- [api-rest-backend/postman/foods-api.postman_collection.json](api-rest-backend/postman/foods-api.postman_collection.json)
- [api-rest-backend/postman/foods-api.postman_environment.json](api-rest-backend/postman/foods-api.postman_environment.json)

## Git

Le dépôt ignore automatiquement:

- `node_modules`
- fichiers `.env` et `.local`
- dossiers `dist`, `build`, `coverage`

## Remarques

- Le backend stocke les aliments dans `api-rest-backend/data/foods.json`.
- Chaque aliment possède sa propre `apiKey` générée par le store.
- Ne mets pas `node_modules` dans Git.
