export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { input } = req.body;

  // Airtable Config
  const baseId = 'appVA6mdGqaBl846K';
  const tableId = encodeURIComponent('Legacy Builder Responses'); // ✅ Encode it!
  const token = 'YOUR_PERSONAL_ACCESS_TOKEN'; // make sure it's still valid

  try {
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

    if (!airtableData.records || airtableData.records.length === 0) {
      console.error('🛑 ANGUS Error: No records found');
      return res.status(404).json({ error: 'No matching records found in Airtable.' });
    }

    const record = airtableData.records[0].fields;

    const mockResponse = `
✅ Business Narrative for: ${record["Name"] || "Unknown Name"}  
✅ GEM Style: ${record["GEM Style"] || "Not Specified"}  
✅ Primary Goal: ${record["Primary Goal"] || "Unknown"}  

🧠 Input you sent: ${input}
    `;

    return res.status(200).json({ response: mockResponse });
  } catch (error) {
    console.error('🔥 ANGUS API Error:', error);
    return res.status(500).json({ error: 'Something went wrong on the server.' });
  }
}
