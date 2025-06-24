const fetch = require("node-fetch");

module.exports = async (req, res) => {
  const siren = req.query.siren;
  if (!siren || !/^[0-9]{9}$/.test(siren)) {
    return res.status(400).json({ error: "Numéro SIREN invalide" });
  }

  const CLIENT_ID = process.env.CLIENT_ID;
  const CLIENT_SECRET = process.env.CLIENT_SECRET;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return res.status(500).json({ error: "Variables d'environnement manquantes" });
  }

  try {
    // Auth INSEE
    const tokenResponse = await fetch("https://api.insee.fr/token", {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials"
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) throw new Error("Token INSEE non obtenu");

    // Requête SIRENE
    const dataResponse = await fetch(`https://api.insee.fr/entreprises/sirene/V3/siren/${siren}`, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`
      }
    });

    const data = await dataResponse.json();

    // Génération numéro TVA intracommunautaire FR
    function getTVA(siren) {
      let s = 12 + 3 * (siren % 97);
      return "FR" + (s < 10 ? "0" + s : s) + siren;
    }

    res.status(200).json({
      siren,
      tva: getTVA(siren),
      unite_legale: data.uniteLegale || null
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};