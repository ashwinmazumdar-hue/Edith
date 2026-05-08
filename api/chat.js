export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, context, model = 'claude-haiku-4-5-20251001', maxTokens = 600 } = req.body;
  if (!message) return res.status(400).json({ error: 'No message' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set in Vercel environment variables' });

  // Whitelist allowed models
  const ALLOWED = [
    'claude-haiku-4-5-20251001',
    'claude-sonnet-4-6',
    'claude-opus-4-6',
  ];
  const safeModel = ALLOWED.includes(model) ? model : ALLOWED[0];

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: safeModel,
        max_tokens: Math.min(maxTokens, 4096),
        system: `You are Edith, a sharp digital media analyst for an Indian performance marketing team at Swiggy Instamart. Answer using Indian number formatting (Lakhs/Crores), rupee (₹) currency, and marketing KPI terminology. Be direct and actionable.\n\nCurrent data context:\n${context}`,
        messages: [{ role: 'user', content: message }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || 'No response';
    res.status(200).json({ reply, model: safeModel });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
