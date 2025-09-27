// /api/check-member.js  (minimal safe debug)
module.exports = async (req, res) => {
  // CORS / preflight
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  // Show whether the environment variables exist (no secrets exposed)
  const brevoKeyPresent = !!process.env.BREVO_API_KEY;
  const membersListIdPresent = !!process.env.MEMBERS_LIST_ID;

  return res.status(200).json({
    brevoKeyPresent,
    membersListIdPresent,
    vercelEnv: process.env.VERCEL_ENV || "undefined",
    nodeVersion: process.version,
  });
};
