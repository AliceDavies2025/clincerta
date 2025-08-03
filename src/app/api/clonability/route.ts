import { NextRequest, NextResponse } from 'next/server';

// Mock database of existing documents for similarity comparison
const mockDocuments = [
  "Patient presented with fever and cough. Prescribed antibiotics.",
  "Patient admitted for chest pain. ECG and labs ordered.",
  "Routine checkup. No abnormal findings.",
];

function textSimilarity(a: string, b: string): number {
  // Simple similarity: Jaccard index on word sets
  const setA = new Set(a.toLowerCase().split(/\W+/));
  const setB = new Set(b.toLowerCase().split(/\W+/));
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Missing or invalid text" }, { status: 400 });
  }

  // Compare input text to each mock document
  let maxSimilarity = 0;
  let mostSimilarDoc = "";
  for (const doc of mockDocuments) {
    const sim = textSimilarity(text, doc);
    if (sim > maxSimilarity) {
      maxSimilarity = sim;
      mostSimilarDoc = doc;
    }
  }

  // Originality score: 100 - (maxSimilarity * 100)
  const originalityScore = Math.round(100 - maxSimilarity * 100);

  return NextResponse.json({
    originality_score: originalityScore,
    most_similar_document: mostSimilarDoc,
    similarity: maxSimilarity,
    details: maxSimilarity > 0.5
      ? "High similarity detected. Possible cloned content."
      : "No significant cloned content detected."
  });
}
