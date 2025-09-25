export default async function handler(req, res) {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: "Missing email" });

    const r = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, {
      headers: {
        accept: "application/json",
        "api-key": process.env.BREVO_API_KEY,
      },
    });

    // Contact not found
    if (r.status === 404) return res.status(200).json({ isMember: false });

    // Other errors - include status and response body so you can see details
    if (!r.ok) {
      const errorText = await r.text();
      return res.status(502).json({
        error: "Brevo API error",
        status: r.status,
        body: errorText,
      });
    }

    const data = await r.json();
    const listIds = Array.isArray(data.listIds) ? data.listIds : [];
    const membersListId = Number(process.env.MEMBERS_LIST_ID);
    const isMember = listIds.includes(membersListId);

    return res.status(200).json({ isMember, listIds });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
