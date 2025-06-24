import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import NodeCache from "node-cache";
dotenv.config();

const app = express();
const cache = new NodeCache();
const port = process.env.PORT || 3000;

async function getToken() {
  if (cache.has("token")) return cache.get("token");

  const auth = Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString("base64");
  const res = await axios.post("https://api.insee.fr/token", "grant_type=client_credentials", {
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
  });

  const token = res.data.access_token;
  cache.set("token", token, 3600);
  return token;
}

app.get("/api/verifier", async (req, res) => {
  const siren = req.query.siren;
  try {
    const token = await getToken();

    const sireneRes = await axios.get(`https://api.insee.fr/entreprises/sirene/V3/unites_legales/${siren}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const vatNumber = "FR" + ((12 + 3 * (siren % 97)) % 97).toString().padStart(2, "0") + siren;

    res.json({
      siren,
      vatNumber,
      unite_legale: sireneRes.data.unite_legale,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(port, () => console.log(`✅ API démarrée sur http://localhost:${port}`));
