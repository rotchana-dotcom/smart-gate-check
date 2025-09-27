// /api/check-member.js  (CommonJS on Vercel)
module.exports = async (req, res) => {
  // --- CORS / Preflight ---
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  // --- Methods allowed: GET, POST ---
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET,POST,OPTIONS");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // --- Read env ---
  const { BREVO_API_KEY, MEMBERS_LIST_ID } = process.env;
  if (!BREVO_API_KEY) return res.status(500).json({ error: "Missing BREVO_API_KEY env" });
  if (!MEMBERS_LIST_ID) return res.status(500).json({ error: "Missing MEMBERS_LIST_ID env" });

  // --- Get email from query (GET) or body (POST) ---
  let email = null;
  if (req.method === "GET") {
    const url = new URL(req.url, `https://${req.headers.host}`);
    email = url.searchParams.get("email");
  } else {
    try {
      if (req.body && typeof req.body === "object") {
        email = req.body.email;
      } else {
        // raw-body fallback
        let buf = "";
        for await (const c of req) buf += c;
        if (buf) email = JSON.parse(buf).email;
      }
    } catch {}
  }
  if (!email) return res.status(400).json({ error: "Missing email" });

  // --- Brevo lookup ---
  const r = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, {
    headers: { accept: "application/json", "api-key": BREVO_API_KEY }
  });

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

  return res.status(200).json({ isMember, listIds, contactId: data.id ?? null });
};
