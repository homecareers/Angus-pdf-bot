export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests are allowed' });
  }

  const { input } = req.body;

  // Airtable Config
  const baseId = 'appVA6mdGqaBl846K';
  const tableId = 'tbla8A3n3oMroTk03'; // ✅ Correct table ID
  const token = 'patZdfRRhYK736L95.fdd6f6c3698ed0403accd321854ae5c09b9bf838a15c41ef4878e01c3f4a34c6';

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/${tableId}?maxRecords=1&sort[0][field]=Timestamp&sort[0][direction]=desc`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!data.records || data.records.length === 0) {
      throw new Error('No records found');
    }

    const record = data.records[0].fields;

    const result = `
✅ Business Narrative for: ${record["Name"] || "Unknown Name"}  
✅ GEM Style: ${record["GEM Style"] || "Not Specified"}  
✅ Primary Goal: ${record["Primary Goal"] || "Unknown"}  

🧠 Input you sent: ${input}
    `;

    return res.status(200).json({ response: result });

  } catch (error) {
    console.error('ANGUS Error:', error.message);
    return res.status(500).json({ error: 'ANGUS encountered an issue: ' + error.message });
  }
}
