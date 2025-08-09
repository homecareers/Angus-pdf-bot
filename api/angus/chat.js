// === EDIT THESE IF YOUR LABELS DIFFER ===
const TABLES = {
  prospects: "Prospects",
  conversations: "Conversations",
  insights: "Insights",
};

const FIELDS = {
  prospects: {
    legacyCode: "Legacy Code", // primary field in Prospects
    // optional contact fields if you ever want them in memory snippet:
    email: "Prospect Email",
    phone: "Prospect Phone",
  },
  conversations: {
    linkToProspect: "Prospect",   // the LINK field in Conversations that points to Prospects
    role: "Role",                 // single select: "user" | "angus"
    message: "Message",           // long text
    topic: "Topic",               // single select (nutrition/sleep/business/other)
    timestamp: "Timestamp",       // created time field
  },
};
// =======================================

export default async function handler(req, res) {
  try {
    // CORS (so GoHighLevel can call this)
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      return res.status(200).end();
    }
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method !== "POST") {
      res.setHeader("Allow", ["POST", "OPTIONS"]);
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { legacyCode, message } = req.body || {};
    if (!legacyCode || !message) {
      return res.status(400).json({ error: "legacyCode and message are required" });
    }

    // 1) Find Prospect by Legacy Code
    const prospect = await findProspectByLegacyCode(legacyCode);
    if (!prospect) {
      return res.status(404).json({ error: `Prospect not found for ${legacyCode}` });
    }

    // 2) Pull last 10 conversation turns
    const recent = await getRecentConversations(prospect.id, 10);

    // 3) Log USER turn
    await createConversation(prospect.id, "user", message, "other");

    // 4) Build ANGUS prompt
    const system = process.env.ANGUS_SYSTEM_PROMPT || "You are ANGUS.";
    const memorySnippet = buildMemorySnippet(prospect, recent);

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
          { role: "user", content: `${memorySnippet}\n\nUser: ${message}` },
        ],
      }),
    });

    if (!openaiResp.ok) {
      const errTxt = await openaiResp.text();
      throw new Error(`OpenAI error: ${errTxt}`);
    }

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
  const url = new URL(`https://api.airtable.com/v0/${AT_BASE}/${encodeURIComponent(TABLES.prospects)}`);
  // filter on primary field "Legacy Code"
  const formula = `{${FIELDS.prospects.legacyCode}}='${legacyCode.replace(/'/g, "\\'")}'`;
  url.searchParams.set("filterByFormula", formula);
  const r = await fetch(url, { headers: { Authorization: `Bearer ${AT_TOKEN}` } });
  const j = await r.json();
  if (!r.ok) throw new Error(`Airtable findProspect failed: ${JSON.stringify(j)}`);
  return j.records?.[0] || null;
}

async function getRecentConversations(prospectId, limit = 10) {
  const url = new URL(`https://api.airtable.com/v0/${AT_BASE}/${encodeURIComponent(TABLES.conversations)}`);
  // Link fields are arrays; ARRAYJOIN turns them into a string so we can FIND the record ID.
  const link = FIELDS.conversations.linkToProspect;
  const formula = `FIND('${prospectId}', ARRAYJOIN({${link}}))`;
  url.searchParams.set("filterByFormula", formula);
  url.searchParams.set("sort[0][field]", FIELDS.conversations.timestamp);
  url.searchParams.set("sort[0][direction]", "desc");
  url.searchParams.set("pageSize", String(limit));

  const r = await fetch(url, { headers: { Authorization: `Bearer ${AT_TOKEN}` } });
  const j = await r.json();
  if (!r.ok) throw new Error(`Airtable getRecentConversations failed: ${JSON.stringify(j)}`);
  return (j.records || []).reverse(); // oldest → newest
}

async function createConversation(prospectId, role, text, topic) {
  const body = {
    records: [
      {
        fields: {
          [FIELDS.conversations.linkToProspect]: [{ id: prospectId }],
          [FIELDS.conversations.role]: role,
          [FIELDS.conversations.message]: text,
          [FIELDS.conversations.topic]: topic,
        },
      },
    ],
  };
  const r = await fetch(`https://api.airtable.com/v0/${AT_BASE}/${encodeURIComponent(TABLES.conversations)}`, {
    method: "POST",
    headers: AT_HEADERS,
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`Airtable createConversation failed: ${JSON.stringify(j)}`);
  return j;
}

function buildMemorySnippet(prospect, recent) {
  const pf = prospect.fields || {};
  const lc = pf[FIELDS.prospects.legacyCode] || "";
  const email = pf[FIELDS.prospects.email] || "";
  const phone = pf[FIELDS.prospects.phone] || "";

  const history = recent
    .map((rec) => {
      const f = rec.fields || {};
      const r = f[FIELDS.conversations.role] || "user";
      const m = f[FIELDS.conversations.message] || "";
      return `${r}: ${m}`;
    })
    .join("\n")
    .slice(-4000);

  return `Known Memory:
Legacy Code: ${lc}
(Ops-only contact on file: ${email} ${phone})

Recent Conversation:
${history}`;
}
