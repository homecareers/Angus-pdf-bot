module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { input } = req.body;

  const mockResponse = `
✅ Business Narrative (Sample output)
✅ Wellness Protocol (Sample output)
✅ Consult Script (Sample output)
Input received: ${input}
  `;

  res.status(200).json({ response: mockResponse });
};
