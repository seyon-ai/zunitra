// api/groq.js — Vercel Serverless Function
// Proxies requests to Groq API
// Key is stored in Vercel Environment Variables — never exposed to browser

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // CORS — allow your Vercel domain
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Get key from Vercel Environment Variable (set in Vercel dashboard)
  const GROQ_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_KEY) {
    return res.status(500).json({ error: "Groq API key not configured on server" });
  }

  try {
    const { messages, max_tokens, temperature } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array is required" });
    }

    // Forward to Groq
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": "Bearer " + GROQ_KEY,
      },
      body: JSON.stringify({
        model:       "llama-3.3-70b-versatile",
        temperature: temperature || 0.7,
        max_tokens:  max_tokens  || 1000,
        messages:    messages,
      }),
    });

    const data = await groqRes.json();

    if (!groqRes.ok) {
      return res.status(groqRes.status).json({ error: data.error?.message || "Groq error" });
    }

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: "Server error: " + err.message });
  }
}
