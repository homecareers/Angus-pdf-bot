export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { input } = req.body;

  // Extract Legacy Code from input using RegEx
  const legacyCodeMatch = input.match(/Legacy-[A-Z0-9\-]+/i);
  const legacyCode = legacyCodeMatch?.[0];

  if (!legacyCode) {
    return res.status(400).json({ error: 'No valid Legacy Code found in input.' });
  }

  // Airtable Config
  const baseId = 'appVA6mdGqaBl846K';
  const tableId = 'tbla8A3n3oMroTk03';
  const token = 'patZdfRRhYK736L95.fdd6f6c3698ed0403accd321854ae5c09b9bf838a15c41ef4878e01c3f4a34c6';

  // Search Airtable by Legacy Code
  const url = `https://api.airtable.com/v0/${baseId}/${tableId}`;
  const filterFormula = encodeURIComponent(`{Legacy Code} = '${legacyCode}'`);

  const airtableResponse = await fetch(`${url}?filterByFormula=${filterFormula}&maxRecords=1`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const airtableData = await airtableResponse.json();

  if (!airtableData.records || airtableData.records.length === 0) {
    return res.status(404).json({ error: 'No record found for that Legacy Code.' });
  }

  const record = airtableData.records[0].fields;

  const response = `
✅ Business Overview
🧾 Legacy Code: ${legacyCode}
💎 Gem Type: ${record["Gem Type"] || 'Not provided'}
💰 Monthly Income Goal: ${record["Monthly Income Goal"] || 'Not specified'}
🧠 Input you sent: ${input}
  `;

  return res.status(200)
