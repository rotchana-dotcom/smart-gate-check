// /api/check-member.js (CommonJS)
module.exports = async (req, res) => {
  const { BREVO_API_KEY, MEMBERS_LIST_ID, VERCEL_URL, VERCEL_ENV } = process.env;
  const hasKey = Boolean(BREVO_API_KEY);
  return res.status(200).json({
    method: req.method,
    has_BREVO_API_KEY: hasKey,
    MEMBERS_LIST_ID,
    vercel: { url: VERCEL_URL || null, env: VERCEL_ENV || null }
  });
};
