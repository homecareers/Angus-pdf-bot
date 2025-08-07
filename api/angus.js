export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { input } = req.body;
  const legacyCode = input.trim();

  // Airtable Config
  const baseId = 'appVA6mdGqaBl846K';
  const tableId = 'tbla8A3n3oMroTk03'; // Correct table ID
  const token = 'patZdfRRhYK736L95.fdd6f6c3698ed0403accd321854ae5c09b9bf838a15c41ef4878e01c3f4a34c6';

  // Query Airtable by Legacy Code
  const airtableResponse = await fetch(
    `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula={Legacy Code}='${legacyCode}'`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const airtableData = await airtableResponse.json();
  const record = airtableData.records[0]?.fields || {};

  const gemType = record["Gem Type"] || "Not specified";
  const incomeGoal = record["Monthly Income Goal"] || "Unknown";
  const tone = gemType === "Ruby" ? "Bold. Fast. High-stakes talk." :
               gemType === "Emerald" ? "Detailed. Precise. Logic-driven." :
               gemType === "Sapphire" ? "Fun. Casual. High-energy." :
               gemType === "Pearl" ? "Heart-first. Relational. Gentle." :
               "Neutral tone.";

  const mockResponse = `
🚀 ANGUS Consult Overview  
=========================  

🧬 Legacy Code: ${legacyCode}  
💎 Gem Type: ${gemType}  
🎯 Monthly Income Goal: ${incomeGoal}  
📆 Timeline: 90 Days  
🔥 Personality Mode: ${tone}

—

✅ BUSINESS NARRATIVE  
You're not here to dip your toe — you're here to dominate. You want cash flow fast, structure without fluff, and duplication without baby-sitting. Here's how we build with you:

• Focus: High-conversion Reels + Power Posts  
• Stack: Energy intro, Weight Loss proof, Biz hook (Video 1–2–3)  
• Strategy: Launch 10-Day Blitz with urgency + elite language  
• Message: “You want bold? I only mentor killers. Let’s build.”  

—

✅ SOCIAL MEDIA GAME PLAN  
🔹 2 Bold Reels/Week (Show your edge)  
🔹 3 Proof Posts/Week (Client or product win)  
🔹 2 Personal Power Posts (Your WHY, but fiery)

Use the Ruby swipe bank. Don’t soften the message — sharpen it.

—

✅ 30-60-90 LEGACY FORECAST  
| Day | Objective | Action |
|-----|-----------|--------|
| 30  | Capture leads | 10-day Blitz, CTA Reels |
| 60  | Convert to builders | Host private team Zoom |
| 90  | Elevate to mentor | Run first duplication pod |

—

💬 Use this during your consult:  
> “This isn’t about playing business — it’s about building legacy. You’re coded for bold moves. Let’s go.”
`;

  return res.status(200).json({ response: mockResponse });
}
