# Tableau de bord KPI

[English](README.md) | **Français**

Tableau de bord interne pour surveiller les modules d'E/S Advantech WISE-4000 déployés sur les
sites de Savoura. Suit une hiérarchie `Site → Machine → Appareil → Canal`, interroge les canaux
de chaque appareil à un intervalle configurable, et conserve l'historique pour les rapports KPI.

## Technologies

- **Next.js 16** (App Router) + React 19
- **Prisma 7** + **PostgreSQL**
- **Tailwind CSS 4**
- **Docker Compose** pour le déploiement local/production

## Modèle de données

- `Site` → `Machine` → `Device` (identifié par adresse MAC/IP, avec identifiants chiffrés)
- `Device` → `Channel_Config` (réglages mode/pause par canal, canaux 1 à 4)
- `Device_Poll` → `Channel_Log` / `Message_Log` (une ligne par tentative d'interrogation, avec
  les valeurs par canal et les messages de l'appareil)

Voir `prisma/schema.prisma` pour le schéma de référence et `project-notes.md` pour le diagramme
UML.

## Interrogation (polling)

Chaque appareil a son propre minuteur interne (`src/lib/polling/scheduler.ts`), afin qu'un
appareil lent ou inaccessible ne bloque jamais l'interrogation des autres. Un appareil passe
automatiquement de `active` à `error` après 5 échecs consécutifs, bascule alors sur un intervalle
de nouvelle tentative plus lent, puis revient automatiquement à `active` dès la prochaine
interrogation réussie. Les identifiants des appareils sont chiffrés au repos
(`src/lib/security/device-credential.ts`).

## Exécution en local

```bash
npm install
```

Créer un fichier `.env` avec :

```
DATABASE_URL=postgresql://user:password@localhost:5432/mydb?schema=public
DEVICE_CREDENTIAL_KEY=<clé AES-256-GCM de 32 octets, en base64>
```

Puis exécuter les migrations et démarrer le serveur de développement :

```bash
npx prisma migrate dev
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Exécution avec Docker

```bash
docker compose up --build
```

Cette commande construit l'image Next.js autonome et la démarre avec un conteneur Postgres
(`compose.yml`). `DEVICE_CREDENTIAL_KEY` doit être défini dans `.env` — le fichier compose
refusera de démarrer sans cette variable.

## Structure du projet

- `src/app/(app)/sites/...` — pages Sites → Machines → Appareils
- `src/components/device/` — carte d'appareil, panneau de configuration, panneau de débogage
- `src/lib/data/` — requêtes Prisma par entité
- `src/lib/polling/` — planificateur et persistance des interrogations
- `prisma/migrations/` — historique du schéma


## Captures d'écran 
![device overview](./screenshots/device-overview.png)
![new device](./screenshots/new-device.png)
