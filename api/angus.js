export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { input } = req.body;

  // Airtable Config
  const baseId = 'appVA6mdGqaBl846K';
  const tableId = 'tbla8A3n3oMroTk03'; // Correct table ID
  const token = 'patZdfRRhYK736L95.fdd6f6c3698ed0403accd321854ae5c09b9bf838a15c41ef4878e01c3f4a34c6';

  // Extract Legacy Code from input (e.g. "Legacy-X25-OP1046")
  const legacyCodeMatch = input.match(/Legacy-[\w-]+/i);
  const legacyCode = legacyCodeMatch ? legacyCodeMatch[0] : null;

  if (!legacyCode) {
    return res.status(400).json({ error: 'Legacy Code not found in input.' });
  }

  try {
    // Search by Legacy Code in Airtable
    const searchUrl = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula={Legacy Code}="${legacyCode}"`;

    const airtableResponse = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const airtableData = await airtableResponse.json();

    if (!airtableData.records || airtableData.records.length === 0) {
      return res.status(404).json({ error: 'No record found for that Legacy Code.' });
    }

    const record = airtableData.records[0].fields;

    // Build the response
    const consultResponse = `
✅ Business Overview for: ${record["Name"] || "Unknown Name"}  
🧬 Legacy Code: ${record["Legacy Code"] || "N/A"}  
💎 GEM Style: ${record["GEM Style"] || "Not specified"}  
🎯 Primary Goal: ${record["Primary Goal"] || "N/A"}  
🧠 Input you sent: ${input}
    `;

    return res.status(200).json({ response: consultResponse });

  } catch (error) {
    return res.status(500).json({ error: `Server error: ${error.message}` });
  }
}
