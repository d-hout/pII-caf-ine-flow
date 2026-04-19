# ☕ Caffeine Flow

Application web de suivi de consommation de caféine. Visualisez en temps réel la caféine dans votre organisme, recevez des alertes personnalisées et améliorez votre sommeil.

## Prérequis

- [Node.js](https://nodejs.org/) (v18+)
- npm
- [MongoDB](https://www.mongodb.com/) (local ou distant, port 27017)

## Installation

```bash
git clone https://github.com/d-hout/pII-caf-ine-flow.git
cd pII-caf-ine-flow
```

## Lancer le back-end

```bash
cd back
npm install
node app.js
```

> Ou avec rechargement automatique : `npm run dev` (nécessite nodemon)

Le serveur démarre sur `http://localhost:5050`.

## Lancer le front-end

```bash
cd frontend
npm install
npm run dev
```

L'application est accessible sur `http://localhost:5173`.

## Stack technique

- **Front-end** : React + Vite, Recharts, React-Leaflet, React-Calendar
- **Back-end** : Node.js, Express, Mongoose
- **Base de données** : MongoDB
