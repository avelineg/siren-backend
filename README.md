# siren-backend

Backend Node.js/Express pour :
- Connexion OAuth2 INPI et proxy sécurisé vers l’API INPI

## Démarrage

1. Copier `.env.example` en `.env` et remplir les variables
2. `npm install`
3. `npm start`

## Routes principales

- `GET /inpi/auth/initiate`  
- `GET /inpi/callback`  
- `GET /inpi/entreprise/:siren`  
- `GET /inpi/recherche?denomination=RAISON_SOCIALE`  
