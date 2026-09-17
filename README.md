# API REST avec Next.js et Prisma

[![Integration continue](https://github.com/rivaldopiaplle-boop/git_api_rest_rivaldo/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/rivaldopiaplle-boop/git_api_rest_rivaldo/actions/workflows/ci.yml?query=branch%3Amain)

Une API REST protégée par clé, et l'interface d'administration qui va avec, dans une seule
application Next.js. Les données vivent dans PostgreSQL, à travers Prisma.

Le projet a commencé en Express, avec les données dans un fichier JSON. C'était parfait
pour apprendre, beaucoup moins pour tenir en ligne : deux visiteurs qui écrivent en même
temps, et le fichier se marche dessus. L'historique du dépôt garde cette première version.

## Ce que l'API expose

| Route | Verbe | Ce qu'elle fait |
| --- | --- | --- |
| `/api/health` | GET | Sonde de santé : elle interroge vraiment la base (`SELECT 1`) |
| `/api/foods` | GET | Liste les plats. Clé exigée |
| `/api/foods` | POST | Crée un plat, valide le corps, renvoie sa clé propre |
| `/api/foods/[id]` | GET | Un plat |
| `/api/foods/[id]` | PUT | Remplace le plat : corps complet attendu |
| `/api/foods/[id]` | PATCH | Ne change que les champs envoyés |
| `/api/foods/[id]` | DELETE | Supprime le plat |

La clé se donne dans l'en-tête `x-api-key`. Sans elle, ou avec une mauvaise clé, l'API
répond 401 sans rien révéler. L'interface d'administration, elle, passe par des actions
serveur et parle directement à Prisma.

```bash
curl -s http://localhost:3000/api/foods -H "x-api-key: $API_KEY"
curl -s -X POST http://localhost:3000/api/foods \
  -H "x-api-key: $API_KEY" -H "Content-Type: application/json" \
  -d '{"name":"Ndole aux crevettes","category":"Plat principal","calories":640,"tags":"cameroun, poisson"}'
```

## Lancer en local

Prérequis : Docker et Node 20.

```bash
node demarrer.mjs
```

Il monte PostgreSQL dans Docker, génère le client Prisma, applique les migrations, amorce
le jeu de démonstration, construit l'application et attend qu'elle réponde. L'interface
s'ouvre alors sur http://localhost:3000.

```bash
node demarrer.mjs --tests     # démarre, joue les tests d'API en HTTP, s'arrête
node demarrer.mjs --arreter   # arrête la base et supprime ses données
```

Le fichier `.env` n'est pas suivi par Git. Au premier lancement, il est créé depuis
`.env.example`, qui pointe déjà sur la base locale.

## Les tests

`tests/api.test.mjs` parle à l'application en HTTP, comme le fera son client : la clé
exigée, un nom vide refusé par le serveur, et le cycle complet d'une ressource, création,
lecture, modification partielle, suppression, puis 404.

```bash
node --test tests/api.test.mjs    # l'application doit tourner
```

## La chaîne d'intégration

À chaque poussée, dans l'ordre où les vérifications coûtent de plus en plus cher :

1. le schéma Prisma est valide et le client se génère ;
2. l'application se construit ;
3. les migrations s'appliquent sur un PostgreSQL réel, la base est amorcée, l'application
   démarre, et les tests l'interrogent en HTTP.

La clé d'API des tests est fabriquée dans la chaîne : aucun secret du dépôt n'est
nécessaire.

## Mettre en ligne

Next.js et Prisma se déploient chez Vercel, avec une base PostgreSQL gratuite chez Neon.

1. Créer un projet sur [neon.tech](https://neon.tech). Il donne deux adresses : celle qui
   passe par le regroupeur de connexions, pour l'application, et la connexion directe,
   pour les migrations.
2. Sur [vercel.com](https://vercel.com), importer ce dépôt. Vercel reconnaît Next.js.
3. Poser trois variables d'environnement : `DATABASE_URL`, `DIRECT_URL` et `API_KEY`.
4. Appliquer les migrations sur la base en ligne, depuis le poste de travail :
   `DATABASE_URL=... DIRECT_URL=... npx prisma migrate deploy`, puis `npx prisma db seed`
   pour le jeu de démonstration.

Neon met la base en veille quand personne ne l'interroge, mais la réveille seule à la
première requête : pas de restauration à faire à la main.
