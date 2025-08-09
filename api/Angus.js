export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", ["POST"]);
      return res.status(405).json({ error: "Method not allowed" });
    }

    // CORS for GHL embed
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    const { legacyCode, message } = req.body || {};
    if (!legacyCode || !message) {
      return res.status(400).json({ error: "legacyCode and message are required" });
    }

    // 1) Prospect by Legacy Code
    const prospect = await findProspectByLegacyCode(legacyCode);
    if (!prospect) {
      return res.status(404).json({ error: `Prospect not found for ${legacyCode}` });
    }

    // 2) Recent convo turns
    const recent = await getRecentConversations(prospect.id, 10);

    // 3) Log USER turn
    await createConversation(prospect.id, "user", message, "other");

    // 4) ANGUS prompt
    const system = process.env.ANGUS_SYSTEM_PROMPT || "You are ANGUS.";
    const memory = buildMemorySnippet(prospect, recent);

    const openaiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          { role: "system", content: system },
          { role: "user", content: `${memory}\n\nUser: ${message}` },
        ],
      }),
    });
    const data = await openaiResp.json();
    const reply = data?.choices?.[0]?.message?.content ?? "…";

    // 5) Log ANGUS turn
    await createConversation(prospect.id, "angus", reply, "other");

    return res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "ANGUS server error" });
  }
}

/* ===== Airtable helpers ===== */
const AT_BASE = process.env.AIRTABLE_BASE_ID;
const AT_TOKEN = process.env.AIRTABLE_TOKEN;
const AT_HEADERS = {
  Authorization: `Bearer ${AT_TOKEN}`,
  "Content-Type": "application/json",
};

async function findProspectByLegacyCode(legacyCode) {
  const url = new URL(`https://api.airtable.com/v0/${AT_BASE}/Prospects`);
  url.searchParams.set("filterByFormula", `{Legacy Code}='${legacyCode}'`);
  const r = await fetch(url, { headers: { Authorization: `Bearer ${AT_TOKEN}` } });
  const j = await r.json();
  return j.records?.[0] || null;
}

async function getRecentConversations(prospectId, limit = 10) {
  const url = new URL(`https://api.airtable.com/v0/${AT_BASE}/Conversations`);
  // Filter by linked record contains this record ID:
  url.searchParams.set(
    "filterByFormula",
    `FIND('${prospectId}', ARRAYJOIN({Prospect}))`
  );
  url.searchParams.set("sort[0][field]", "Timestamp");
  url.searchParams.set("sort[0][direction]", "desc");
  url.searchParams.set("pageSize", String(limit));

  const r = await fetch(url, { headers: { Authorization: `Bearer ${AT_TOKEN}` } });
  const j = await r.json();
  return (j.records || []).reverse(); // oldest → newest
}

async function createConversation(prospectId, role, text, topic) {
  const r = await fetch(`https://api.airtable.com/v0/${AT_BASE}/Conversations`, {
    method: "POST",
    headers: AT_HEADERS,
    body: JSON.stringify({
      records: [
        {
          fields: {
            Prospect: [{ id: prospectId }],
            Role: role,
            Message: text,
            Topic: topic,
          },
        },
      ],
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`Airtable createConversation failed: ${JSON.stringify(j)}`);
  return j;
}

function buildMemorySnippet(prospect, recent) {
  const lc = prospect.fields?.["Legacy Code"];
  const hist = recent
    .map((rec) => `${rec.fields?.Role || "user"}: ${rec.fields?.Message || ""}`)
    .join("\n")
    .slice(-4000);
  return `Known Memory:
Legacy Code: ${lc}

Recent Conversation:
${hist}`;
}
