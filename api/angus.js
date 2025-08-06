export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { input } = req.body;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are ANGUS™, the elite AI strategist behind The Legacy Code™ and Real Brick Road™ systems. Respond with a custom Business Narrative, Social Media Plan, 30-60-90 Forecast, Wellness Protocol, and GEM-style Consult Script. Use modern language, smart formatting, and high-impact tone. Always assume the user input includes a Legacy Code referring to survey answers stored in Airtable (even if they're not visible). Infer personality (Ruby, Sapphire, Emerald, Pearl) from context and write accordingly."
          },
          {
            role: "user",
            content: input
          }
        ],
        temperature: 0.85,
        max_tokens: 1500,
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const gptResponse = data.choices[0].message.content;

    return res.status(200).json({ response: gptResponse });

  } catch (err) {
    console.error("ANGUS™ Error:", err);
    return res.status(500).json({ error: "ANGUS™ had a system error. Try again." });
  }
}
