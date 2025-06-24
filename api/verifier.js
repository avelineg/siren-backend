
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const siren = req.query.siren;
  if (!siren) return res.status(400).json({ error: 'SIREN manquant' });

  const token_url = 'https://api.insee.fr/token';
  const data_url = `https://api.insee.fr/entreprises/sirene/V3/siren/${siren}`;

  const client_id = process.env.INSEE_CLIENT_ID;
  const client_secret = process.env.INSEE_CLIENT_SECRET;

  if (!client_id || !client_secret) {
    return res.status(500).json({ error: 'Identifiants INSEE manquants' });
  }

  try {
    const tokenResponse = await fetch(token_url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${client_id}:${client_secret}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials'
    });

    const tokenData = await tokenResponse.json();
    console.log("Token response:", tokenData);

    if (!tokenData.access_token) {
      return res.status(500).json({ error: 'Token INSEE non obtenu', details: tokenData });
    }

    const inseeResponse = await fetch(data_url, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const inseeData = await inseeResponse.json();
    console.log("INSEE API result:", inseeData);

    if (!inseeData.etablissement) {
      return res.status(404).json({ error: 'Aucun établissement trouvé' });
    }

    return res.status(200).json(inseeData.etablissement);
  } catch (e) {
    console.error("Erreur API INSEE:", e);
    return res.status(500).json({ error: 'Erreur lors de la requête INSEE', message: e.message });
  }
};
