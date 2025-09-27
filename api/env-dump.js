// /api/env-dump.js
module.exports = async (req, res) => {
  const safe = {};
  Object.keys(process.env).forEach(key => {
    if (key === 'BREVO_API_KEY') {
      safe[key] = process.env[key] ? "✅ PRESENT" : "❌ MISSING";
    } else {
      safe[key] = process.env[key] ? "..." : "undefined";
    }
  });

  return res.status(200).json({
    dump: safe
  });
};
