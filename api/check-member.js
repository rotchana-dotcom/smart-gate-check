export default async function handler(req, res) {
  try {
    if (!process.env.BREVO_API_KEY) {
      return res.status(500).json({ error: "Missing BREVO_API_KEY env" });
    }
    if (!process.env.MEMBERS_LIST_ID) {
      return res.status(500).json({ error: "Missing MEMBERS_LIST_ID env" });
    }

    const email = req.query.email;
    if (!email) return res.status(400).json({ error: "Missing email" });

    const r = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, {
      headers: { accept: "application/json", "api-key": process.env.BREVO_API_KEY },
    });

    if (r.status === 404) return res.status(200).json({ isMember: false });
    if (!r.ok) {
      const body = await r.text();
      return res.status(502).json({ error: "Brevo API error", status: r.status, body });
    }

    const data = await r.json();
    const isMember = (Array.isArray(data.listIds) ? data.listIds : [])
      .includes(Number(process.env.MEMBERS_LIST_ID));
    return res.status(200).json({ isMember, listIds: data.listIds || [] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
