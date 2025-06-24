export default async function handler(req, res) {
  const { siren } = req.query;

  const client_id = process.env.INSEE_CLIENT_ID;
  const client_secret = process.env.INSEE_CLIENT_SECRET;

  // Récupérer le token d'accès
  const tokenResponse = await fetch("https://api.insee.fr/token", {
    method: "POST",
    headers: {
      "Authorization": "Basic " + Buffer.from(`${client_id}:${client_secret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  const tokenData = await tokenResponse.json();
  const access_token = tokenData.access_token;

  if (!access_token) {
    return res.status(500).json({ error: "Token INSEE non obtenu" });
  }

  try {
    const apiResponse = await fetch(`https://api.insee.fr/entreprises/sirene/V3/siren/${siren}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Accept": "application/json"
      }
    });

    if (!apiResponse.ok) {
      const text = await apiResponse.text();
      return res.status(apiResponse.status).json({ error: "Erreur lors de la requête INSEE", message: text });
    }

    const data = await apiResponse.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la requête INSEE", message: error.message });
  }
}
