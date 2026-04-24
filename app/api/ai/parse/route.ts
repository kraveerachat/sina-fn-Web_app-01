import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'No API key' }, { status: 500 });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a Thai personal finance assistant. Parse the following text and return ONLY a JSON object.

Input: "${message}"

Rules:
- type "income" when: โอน, ให้เงิน, รับเงิน, เงินเดือน, salary, โบนัส, ได้รับ, แม่ให้, พ่อให้, โอนมา, ฝากมา, ได้เงิน, รายได้
- type "expense" for everything else
- wallet_hint = bank/wallet name if mentioned (SCB, KBank, TTB, KTB, เงินสด, PromptPay)
- emoji should match category

Return this exact JSON structure (no markdown, no backticks, just raw JSON):
{"transactions":[{"description":"string","amount":number,"type":"income","category":"รายได้","emoji":"💰","wallet_hint":"SCB"}]}`
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    if (!response.ok) {
      const errData = await response.json();
      console.error('Gemini HTTP error:', errData);
      return NextResponse.json({ error: 'Gemini API error', details: errData }, { status: 500 });
    }

    const data = await response.json();
    console.log('Raw response:', JSON.stringify(data));

    const parts = data.candidates?.[0]?.content?.parts || []
    let text = ''
    for (const part of parts) {
      if (part.text && !part.thought) {
        text += part.text
      }
    }

    console.log('Extracted text:', text);

    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    // Clean and extract JSON
    const clean = text
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    // Find JSON object
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in:', clean);
      throw new Error('No JSON in response: ' + clean);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);

  } catch (error) {
    console.error('Parse error:', error);
    return NextResponse.json({
      error: 'Parse failed',
      details: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 });
  }
}