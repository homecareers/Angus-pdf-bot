export default async function handler(req, res) {
  console.log("⚙️ Request received", req.body);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { input } = req.body;
  console.log("📥 Input:", input);

  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = encodeURIComponent(process.env.AIRTABLE_TABLE_NAME);
  const token = process.env.AIRTABLE_TOKEN;
  console.log("🔐 Config:", { baseId, tableName });

  const url = `https://api.airtable.com/v0/${baseId}/${tableName}?maxRecords=1&sort[0][field]=Timestamp&sort[0][direction]=desc`;
  console.log("🔗 Airtable URL:", url);

  try {
    const airtableResp = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const airtableJson = await airtableResp.json();
    console.log("📦 Airtable Response:", airtableJson);

    const fields = airtableJson.records?.[0]?.fields;
    if (!fields) {
      throw new Error("No records found");
    }

    const gptPrompt = `Legacy record: ${JSON.stringify(fields)}\n\nRequest:\n${input}`;
    console.log("🧠 GPT Prompt:", gptPrompt);

    return res.status(200).json({ response: "OK (backend logs visible)" });
  } catch (err) {
    console.error("🔴 ANGUS Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
