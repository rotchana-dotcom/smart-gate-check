export default async function handler(req, res) {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: "Missing email" });

    const r = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, {
      headers: {
        "accept": "application/json",
        "api-key": process.env.BREVO_API_KEY
      }
    });

    if (r.status === 404) return res.status(200).json({ isMember: false });
    if (!r.ok) return res.status(500).json({ error: "Brevo API error" });

    const data = await r.json();
    const listIds = Array.isArray(data.listIds) ? data.listIds : [];
    const isMember = listIds.includes(Number(process.env.MEMBERS_LIST_ID));

    return res.status(200).json({ isMember });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
