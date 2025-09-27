// /api/check-member.js  (CommonJS)

module.exports = async (req, res) => {
  try {
    const { BREVO_API_KEY, MEMBERS_LIST_ID } = process.env;

    if (!BREVO_API_KEY) {
      return res.status(500).json({ error: "Missing BREVO_API_KEY env" });
    }
    if (!MEMBERS_LIST_ID) {
      return res.status(500).json({ error: "Missing MEMBERS_LIST_ID env" });
    }

    // Robust query parsing (works in Vercel Node serverless)
    const url = new URL(req.url, `https://${req.headers.host}`);
    const email = url.searchParams.get("email");
    if (!email) {
      return res.status(400).json({ error: "Missing email" });
    }

    const r = await fetch(
      `https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`,
      {
        headers: {
          accept: "application/json",
          "api-key": BREVO_API_KEY,
        },
      }
    );

    if (r.status === 404) {
      return res.status(200).json({ isMember: false, reason: "not_found" });
    }

    if (!r.ok) {
      const body = await r.text();
      return res.status(502).json({ error: "Brevo API error", status: r.status, body });
    }

    const data = await r.json();
    const listIds = Array.isArray(data.listIds) ? data.listIds : [];
    const isMember = listIds.includes(Number(MEMBERS_LIST_ID));

    return res.status(200).json({
      isMember,
      listIds,
      contactId: data.id ?? null,
    });
  } catch (e) {
    return res.status(500).json({ error: "Server error", message: String(e) });
  }
};
