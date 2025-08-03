import { NextRequest, NextResponse } from 'next/server';

// Mock clinical guideline keywords for demo purposes
const guidelineKeywords = [
  "assessment",
  "diagnosis",
  "intervention",
  "outcome",
  "follow-up",
  "medication",
  "vital signs",
  "patient education",
  "care plan",
  "documentation",
];

function nlpIntegrityScore(text: string): { score: number; missing: string[]; feedback: string } {
  const textLower = text.toLowerCase();
  const found = guidelineKeywords.filter(keyword => textLower.includes(keyword));
  const missing = guidelineKeywords.filter(keyword => !textLower.includes(keyword));
  const score = Math.round((found.length / guidelineKeywords.length) * 100);

  let feedback = "";
  if (score === 100) {
    feedback = "Document meets all clinical guideline criteria.";
  } else if (score > 70) {
    feedback = "Document aligns well with clinical guidelines. Consider adding: " + missing.join(", ");
  } else {
    feedback = "Document is missing several key clinical guideline elements: " + missing.join(", ");
  }

  return { score, missing, feedback };
}

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Missing or invalid text" }, { status: 400 });
  }

  const result = nlpIntegrityScore(text);

  return NextResponse.json({
    integrity_score: result.score,
    missing_elements: result.missing,
    feedback: result.feedback,
  });
}
