import { NextRequest, NextResponse } from 'next/server';

// Audit criteria for demo purposes
const criteria = [
  { key: "clarity", description: "Is the documentation clear and unambiguous?" },
  { key: "completeness", description: "Are all required sections present?" },
  { key: "timeliness", description: "Is the documentation up-to-date and timely?" },
  { key: "clinical_guidelines", description: "Does it follow clinical guidelines?" },
  { key: "patient_care_link", description: "Are patient care actions linked to interventions?" },
];

// Mock training resources
const trainingResources = {
  clarity: "https://www.clinicaldocumentation.com/clarity-training",
  completeness: "https://www.clinicaldocumentation.com/completeness-training",
  timeliness: "https://www.clinicaldocumentation.com/timeliness-training",
  clinical_guidelines: "https://www.clinicaldocumentation.com/guidelines-training",
  patient_care_link: "https://www.clinicaldocumentation.com/golden-thread-training",
};

function auditDocument(text: string) {
  const textLower = text.toLowerCase();
  let score = 0;
  let feedback: string[] = [];
  let suggestions: string[] = [];
  let training: string[] = [];

  // Simple checks for demo
  if (textLower.includes("clear") || textLower.includes("unambiguous")) {
    score += 20;
  } else {
    feedback.push("Documentation could be clearer.");
    suggestions.push("Use precise language and avoid ambiguity.");
    training.push(trainingResources.clarity);
  }

  if (textLower.includes("assessment") && textLower.includes("diagnosis") && textLower.includes("intervention")) {
    score += 20;
  } else {
    feedback.push("Some required sections may be missing.");
    suggestions.push("Ensure assessment, diagnosis, and intervention sections are included.");
    training.push(trainingResources.completeness);
  }

  if (textLower.includes("date") || textLower.includes("timely")) {
    score += 20;
  } else {
    feedback.push("Documentation may not be up-to-date.");
    suggestions.push("Include dates and ensure documentation is timely.");
    training.push(trainingResources.timeliness);
  }

  if (textLower.includes("guideline") || textLower.includes("protocol")) {
    score += 20;
  } else {
    feedback.push("Clinical guidelines not referenced.");
    suggestions.push("Reference clinical guidelines or protocols where appropriate.");
    training.push(trainingResources.clinical_guidelines);
  }

  if (textLower.includes("care plan") && textLower.includes("intervention")) {
    score += 20;
  } else {
    feedback.push("Patient care actions may not be linked to interventions.");
    suggestions.push("Connect care plans with interventions for golden thread compliance.");
    training.push(trainingResources.patient_care_link);
  }

  return {
    audit_score: score,
    feedback,
    suggestions,
    training_recommendations: training,
  };
}

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Missing or invalid text" }, { status: 400 });
  }

  const result = auditDocument(text);

  return NextResponse.json(result);
}
