// /api/check-member.js  (Brevo membership check + safe debug)
module.exports = async (req, res) => {
  // --- CORS / preflight ---
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  // --- quick sanity: show presence of env vars (no secrets) ---
  const hasBrevo = !!process.env.BREVO_API_KEY;
  const hasList  = !!process.env.MEMBERS_LIST_ID;

  // If no email query, return sanity info for easy checks in the browser
  if (!req.query.email) {
    return res.status(200).json({
      brevoKeyPresent: hasBrevo,
      membersListIdPresent: hasList,
      vercelEnv: process.env.VERCEL_ENV || "undefined",
      nodeVersion: process.version,
    });
  }

  // --- real check starts here ---
  if (!hasBrevo) return res.status(500).json({ error: "Missing BREVO_API_KEY env" });
  if (!hasList)  return res.status(500).json({ error: "Missing MEMBERS_LIST_ID env" });

  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const MEMBERS_LIST_ID = Number(process.env.MEMBERS_LIST_ID);

  try {
    const email = String(req.query.email).trim().toLowerCase();
    if (!email) return res.status(400).json({ error: "Invalid email" });

    // Brevo v3 contacts endpoint – get contact by email
    // docs: GET /v3/contacts/{identifier}
    const resp = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, {
      headers: {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
      },
    });

    if (resp.status === 404) {
      // contact not found in Brevo at all
      return res.status(200).json({ email, isMember: false, reason: "contact_not_found" });
    }

    if (!resp.ok) {
      const t = await resp.text().catch(() => "");
      return res.status(502).json({ error: "brevo_error", status: resp.status, body: t });
    }

    const data = await resp.json(); // expect { ... , listIds: [number, ...] }
    const ids = Array.isArray(data.listIds) ? data.listIds : [];
    const isMember = ids.includes(MEMBERS_LIST_ID);

    return res.status(200).json({ email, isMember, listIds: ids });
  } catch (err) {
    console.error("check-member error:", err);
    return res.status(500).json({ error: "server_error" });
  }
};
