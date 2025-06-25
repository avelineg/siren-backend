const express = require('express');
const cors = require('cors');
const app = express();

// Autorise toutes les origines (à restreindre selon besoin)
app.use(cors());

// Pour parser le JSON si besoin
app.use(express.json());

// Route d'accueil (optionnelle : pour afficher un message sur "/")
app.get('/', (req, res) => {
  res.send('Backend INPI opérationnel !');
});

// Route d'initiation d'authentification INPI
app.get('/inpi/auth/initiate', (req, res) => {
  // Ici, tu mets ta logique d'initiation d'authentification INPI
  // Par exemple : rediriger vers le portail INPI, générer un lien, etc.
  // Pour le test, on affiche juste un message :
  res.send('Route /inpi/auth/initiate atteinte et fonctionnelle !');
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur backend démarré sur le port ${PORT}`);
});
