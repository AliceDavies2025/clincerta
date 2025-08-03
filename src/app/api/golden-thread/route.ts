import { NextRequest, NextResponse } from 'next/server';

// Mock keywords for patient actions and interventions
const actionKeywords = [
  "assessment", "monitor", "observe", "evaluate", "review", "document"
];
const interventionKeywords = [
  "medication", "therapy", "procedure", "treatment", "intervention", "care plan"
];

function checkGoldenThread(text: string): { compliant: boolean; feedback: string; actions: string[]; interventions: string[] } {
  const textLower = text.toLowerCase();
  const actions = actionKeywords.filter(keyword => textLower.includes(keyword));
  const interventions = interventionKeywords.filter(keyword => textLower.includes(keyword));

  let compliant = false;
  let feedback = "";

  if (actions.length > 0 && interventions.length > 0) {
    compliant = true;
    feedback = `Document connects patient actions (${actions.join(", ")}) with interventions (${interventions.join(", ")}).`;
  } else if (actions.length === 0 && interventions.length === 0) {
    feedback = "No patient actions or interventions detected. Document is not compliant.";
  } else if (actions.length === 0) {
    feedback = "Patient actions missing. Document is not fully compliant.";
  } else {
    feedback = "Interventions missing. Document is not fully compliant.";
  }

  return { compliant, feedback, actions, interventions };
}

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Missing or invalid text" }, { status: 400 });
  }

  const result = checkGoldenThread(text);

  return NextResponse.json({
    golden_thread_compliance: result.compliant ? "Compliant" : "Non-compliant",
    feedback: result.feedback,
    actions_found: result.actions,
    interventions_found: result.interventions,
  });
}
