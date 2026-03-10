# Caffeine Flow


Prérequis
- Node.js 
- npm
- MongoDB (local ou distant)

Étapes
1) Cloner le dépôt

```bash
git clone https://github.com/d-hout/pII-caf-ine-flow.git
cd pII-caf-ine-flow
```

2) S'assurer que MongoDB est démarré et écoute sur le port 27017 

3) Lancer le back

```bash
cd back
npm install
npm run dev  
```

4) Lancer le front

```bash
cd ../frontend
npm install
npm run dev
```