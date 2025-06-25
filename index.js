import express from "express";
import axios from "axios";
import session from "express-session";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

app.use(session({
  secret: "secretUltraSecure",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Passe à true si HTTPS uniquement
}));

app.use(express.json());

// --------- ROUTES INPI ---------

// 1. Lancer l'authentification OAuth2 INPI
app.get("/inpi/auth/initiate", (req, res) => {
  const authUrl = `https://oauth.inpi.fr/auth/realms/partenaire-connect/protocol/openid-connect/auth?response_type=code&client_id=${process.env.INPI_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.INPI_REDIRECT_URI)}&scope=openid`;
  res.redirect(authUrl);
});

// 2. Callback OAuth2 INPI
app.get("/inpi/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Code INPI manquant");
  try {
    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", process.env.INPI_REDIRECT_URI);
    params.append("client_id", process.env.INPI_CLIENT_ID);
    params.append("client_secret", process.env.INPI_CLIENT_SECRET);

    const tokenResp = await axios.post(
      "https://oauth.inpi.fr/auth/realms/partenaire-connect/protocol/openid-connect/token",
      params,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    req.session.inpi_access_token = tokenResp.data.access_token;
    // Redirige vers le frontend
    res.redirect(process.env.FRONTEND_URL || "http://localhost:3000");
  } catch (e) {
    res.status(500).send("Erreur lors de l'échange du code INPI");
  }
});

// 3. Proxy API INPI - Recherche par SIREN
app.get("/inpi/entreprise/:siren", async (req, res) => {
  const token = req.session?.inpi_access_token;
  if (!token) return res.status(401).json({ error: "Non authentifié INPI" });
  try {
    const siren = req.params.siren;
    const result = await axios.get(
      `https://api.inpi.fr/entreprises/sirene/v3/unites_legales/${siren}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    res.json(result.data);
  } catch (e) {
    res.status(500).json({ error: "Erreur INPI", details: e.message });
  }
});

// 4. Proxy API INPI - Recherche par dénomination sociale
app.get("/inpi/recherche", async (req, res) => {
  const token = req.session?.inpi_access_token;
  const denomination = req.query.denomination;
  if (!token) return res.status(401).json({ error: "Non authentifié INPI" });
  if (!denomination) return res.status(400).json({ error: "Paramètre denomination requis" });
  try {
    const url = `https://api.inpi.fr/entreprises/sirene/v3/unites_legales?nom_raison_sociale=${encodeURIComponent(denomination)}&nombre=1`;
    const result = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    res.json(result.data);
  } catch (e) {
    res.status(500).json({ error: "Erreur INPI", details: e.message });
  }
});

app.get("/", (req, res) => {
  res.send("SIREN backend API (INPI uniquement)");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log("Backend démarré sur port", PORT);
});
