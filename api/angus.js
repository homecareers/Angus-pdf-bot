export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { input } = req.body;

  // Airtable Config
  const baseId = 'appVA6mdGqaBl846K';
  const tableId = 'Legacy%20Builder%20Responses';
  const token = 'patZdfRRhYK736L95.fdd6f6c3698ed0403accd321854ae5c09b9bf838a15c41ef4878e01c3f4a34c6';

  // Fetch latest matching record
  const airtableResponse = await fetch(
    `https://api.airtable.com/v0/${baseId}/${tableId}?maxRecords=1&sort[0][field]=Timestamp&sort[0][direction]=desc`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const airtableData = await airtableResponse.json();
  const record = airtableData.records[0]?.fields || {};

  // Build your consult logic based on Airtable record
  const mockResponse = `
✅ Business Narrative for: ${record["Name"] || "Unknown Name"}  
✅ GEM Style: ${record["GEM Style"] || "Not Specified"}  
✅ Primary Goal: ${record["Primary Goal"] || "Unknown"}  

🧠 Input you sent: ${input}
  `;

  return res.status(200).json({ response: mockResponse });
}
