export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { input } = req.body;

  // ✅ Extract Legacy Code from input
  const legacyCodeMatch = input.match(/Legacy-[\w-]+/i);
  const legacyCode = legacyCodeMatch ? legacyCodeMatch[0] : null;

  if (!legacyCode) {
    return res.status(400).json({ error: 'No Legacy Code found in input' });
  }

  // ✅ Airtable Config
  const baseId = 'appVA6mdGqaBl846K';
  const tableId = 'tbla8A3n3oMroTk03'; // Airtable's Table ID for "Legacy Builder Responses"
  const token = 'patZdfRRhYK736L95.fdd6f6c3698ed0403accd321854ae5c09b9bf838a15c41ef4878e01c3f4a34c6';

  // ✅ Fetch matching record from Airtable
  const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula={Legacy Code}='${legacyCode}'`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!data.records || data.records.length === 0) {
    return res.status(404).json({ error: 'No matching Legacy Code found in Airtable' });
  }

  const record = data.records[0].fields;

  // ✅ Response formatting
  const businessOverview = `
✅ Business Overview for Legacy Code: ${legacyCode}
💎 Gem Type: ${record["Gem Type"] || "Not specified"}
💰 Monthly Income Goal: ${record["Monthly Income Goal"] || "N/A"}
🧠 Input you sent: ${input}
  `;

  return res.status(200).json({ response: businessOverview });
}
