import { NextRequest, NextResponse } from 'next/server';

// Define section types and their relevant keywords
const documentSections = {
  patientInformation: ['patient', 'name', 'id', 'dob', 'date of birth', 'demographics'],
  chiefComplaint: ['chief complaint', 'presenting problem', 'reason for visit', 'primary concern'],
  history: ['history', 'medical history', 'past medical', 'social history', 'family history'],
  examination: ['examination', 'physical exam', 'assessment findings', 'clinical findings', 'observe'],
  diagnosis: ['diagnosis', 'impression', 'diagnostic', 'condition', 'problem'],
  plan: ['plan', 'treatment plan', 'care plan', 'recommendation', 'next steps'],
  medications: ['medication', 'prescription', 'drug', 'dose', 'therapy', 'treatment']
};

// Define key connections that form a "golden thread"
const keyConnections = [
  ['chiefComplaint', 'examination'],
  ['examination', 'diagnosis'],
  ['diagnosis', 'plan'],
  ['plan', 'medications'],
  ['chiefComplaint', 'diagnosis'],
  ['history', 'diagnosis'],
  ['diagnosis', 'medications']
];

function checkGoldenThread(text: string): { 
  compliant: boolean; 
  feedback: string; 
  actions: string[]; 
  interventions: string[];
  sectionsCovered: string[];
  connectionScore: number;
  missingConnections: string[];
  documentStructure: Record<string, boolean>;
} {
  const textLower = text.toLowerCase();
  
  // Original simple keyword matching
  const actionKeywords = [
    "assessment", "monitor", "observe", "evaluate", "review", "document"
  ];
  
  const interventionKeywords = [
    "medication", "therapy", "procedure", "treatment", "intervention", "care plan"
  ];
  
  const actions = actionKeywords.filter(keyword => textLower.includes(keyword));
  const interventions = interventionKeywords.filter(keyword => textLower.includes(keyword));

  // More sophisticated section identification
  const documentStructure: Record<string, boolean> = {};
  const identifiedSections: string[] = [];
  
  for (const [section, keywords] of Object.entries(documentSections)) {
    const sectionPresent = keywords.some(keyword => textLower.includes(keyword));
    documentStructure[section] = sectionPresent;
    
    if (sectionPresent) {
      identifiedSections.push(section);
    }
  }
  
  // Connection analysis between sections
  const foundConnections: string[] = [];
  const missingConnections: string[] = [];
  
  for (const [section1, section2] of keyConnections) {
    const connectionName = `${section1}-to-${section2}`;
    
    if (documentStructure[section1] && documentStructure[section2]) {
      // Check if sections are semantically connected, not just present
      if (checkSectionConnection(text, documentSections[section1 as keyof typeof documentSections], 
                                documentSections[section2 as keyof typeof documentSections])) {
        foundConnections.push(connectionName);
      } else {
        missingConnections.push(connectionName);
      }
    } else if (documentStructure[section1] || documentStructure[section2]) {
      // One section exists but not the other
      missingConnections.push(connectionName);
    }
  }
  
  // Calculate connection score as a percentage
  const connectionScore = keyConnections.length > 0 
    ? Math.round((foundConnections.length / keyConnections.length) * 100) 
    : 0;
  
  // Determine compliance based on enhanced criteria
  let compliant = false;
  let feedback = "";
  
  if (connectionScore >= 70 && identifiedSections.length >= 5) {
    compliant = true;
    feedback = `Document maintains a strong golden thread with ${connectionScore}% of key clinical connections. ` + 
               `Found connections: ${foundConnections.join(", ")}.`;
  } else if (connectionScore >= 50) {
    feedback = `Document shows partial golden thread compliance (${connectionScore}%). ` + 
               `Missing connections: ${missingConnections.join(", ")}.`;
  } else {
    feedback = `Document lacks a clear golden thread (${connectionScore}%). ` +
               `Key sections missing: ${Object.entries(documentStructure)
                 .filter(([_, present]) => !present)
                 .map(([section]) => section)
                 .join(", ")}.`;
  }
  
  // Add detailed analysis of actions and interventions
  if (actions.length > 0 && interventions.length > 0) {
    feedback += ` Document connects patient actions (${actions.join(", ")}) with interventions (${interventions.join(", ")}).`;
  } else if (actions.length === 0) {
    feedback += " Patient actions missing.";
  } else if (interventions.length === 0) {
    feedback += " Interventions missing.";
  }

  return { 
    compliant, 
    feedback, 
    actions, 
    interventions, 
    sectionsCovered: identifiedSections,
    connectionScore,
    missingConnections,
    documentStructure
  };
}

// Helper function to check connections between sections
function checkSectionConnection(text: string, section1Keywords: string[], section2Keywords: string[]): boolean {
  const textLower = text.toLowerCase();
  const paragraphs = textLower.split(/\n\n|\r\n\r\n/).map(p => p.trim()).filter(p => p.length > 0);
  
  // Find paragraphs containing keywords from each section
  const section1Paragraphs = paragraphs.filter(p => 
    section1Keywords.some(keyword => p.includes(keyword))
  );
  
  const section2Paragraphs = paragraphs.filter(p => 
    section2Keywords.some(keyword => p.includes(keyword))
  );
  
  // Simple connection: Check if there are shared keywords between paragraphs
  for (const p1 of section1Paragraphs) {
    for (const p2 of section2Paragraphs) {
      // Extract significant words (3+ chars) from paragraphs
      const words1 = p1.split(/\s+/).filter(w => w.length > 3);
      const words2 = p2.split(/\s+/).filter(w => w.length > 3);
      
      // Check for shared significant words (ignoring common words)
      const commonWords = words1.filter(w => words2.includes(w));
      if (commonWords.length >= 2) {
        return true;
      }
    }
  }
  
  return false;
}

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Missing or invalid text" }, { status: 400 });
  }

  const result = checkGoldenThread(text);

  return NextResponse.json({
    golden_thread_compliance: result.compliant ? "Compliant" : "Non-compliant",
    compliance_score: result.connectionScore,
    feedback: result.feedback,
    actions_found: result.actions,
    interventions_found: result.interventions,
    sections_covered: result.sectionsCovered,
    missing_connections: result.missingConnections,
    section_coverage: result.documentStructure
  });
}
