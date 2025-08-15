import { NextRequest, NextResponse } from 'next/server';
import * as natural from 'natural';
import nlp from 'compromise';

// Define custom medical terminology for compromise
nlp.extend({
  words: {
    diabetes: 'Condition',
    hypertension: 'Condition',
    arthritis: 'Condition',
    asthma: 'Condition',
    cancer: 'Condition',
    
    acetaminophen: 'Medication',
    ibuprofen: 'Medication',
    aspirin: 'Medication',
    lisinopril: 'Medication',
    metformin: 'Medication',
    
    heart: 'Anatomy',
    lung: 'Anatomy',
    liver: 'Anatomy',
    kidney: 'Anatomy',
    brain: 'Anatomy',
    
    surgery: 'Treatment',
    therapy: 'Treatment',
    rehabilitation: 'Treatment',
    
    pain: 'Symptom',
    fatigue: 'Symptom',
    fever: 'Symptom',
    cough: 'Symptom',
    nausea: 'Symptom'
  },
  tags: {
    '#Medication': '(blood pressure|heart|cholesterol|pain) (medication|medicine|drug)',
    '#Condition': '(chronic|acute|severe) [#Condition]',
    '#Treatment': '(physical|occupational|speech|respiratory) therapy',
    '#Anatomy': '(left|right) [#Anatomy]',
    '#Symptom': '(mild|moderate|severe) [#Symptom]'
  }
});

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

// Clinical guidelines categories with associated terms
const clinicalGuidelines = {
  assessment: ["assessment", "evaluation", "examination", "review", "analyze", "check", "inspect"],
  diagnosis: ["diagnosis", "diagnostic", "differential", "identification", "determine", "classify"],
  intervention: ["intervention", "treatment", "therapy", "procedure", "approach", "protocol", "management"],
  medication: ["medication", "drug", "prescription", "dose", "dosage", "administer", "pharmaceutical"],
  documentation: ["documentation", "record", "chart", "note", "document", "report", "log"],
  followUp: ["follow-up", "monitoring", "subsequent", "check-in", "review", "continuing care"],
  patientEducation: ["patient education", "inform", "instruct", "counsel", "guidance", "teaching", "advise"]
};

// Initialize Natural tokenizer
const wordTokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;
const stemmer = natural.PorterStemmer;

async function nlpIntegrityScore(text: string): Promise<{ 
  score: number; 
  missing: string[]; 
  feedback: string;
  entities: any[];
  keyPhrases: string[];
  categoryCoverage: Record<string, number>
}> {
  // Basic keyword check
  const textLower = text.toLowerCase();
  const found = guidelineKeywords.filter(keyword => textLower.includes(keyword));
  const missing = guidelineKeywords.filter(keyword => !textLower.includes(keyword));
  const basicScore = Math.round((found.length / guidelineKeywords.length) * 100);
  
  // NLTK-based processing
  const tokens = wordTokenizer.tokenize(text);
  const stems = tokens.map(token => stemmer.stem(token));
  
  // TF-IDF analysis to find key terms
  const tfidf = new TfIdf();
  tfidf.addDocument(text);
  const keyPhrases: string[] = [];
  tfidf.listTerms(0).slice(0, 10).forEach(item => {
    keyPhrases.push(item.term);
  });
  
  // Compromise.js entity recognition (with custom medical terms)
  const doc = nlp(text);
  
  // Extract medical entities using our custom tags
  const entities = [
    ...doc.match('#Condition').out('array').map((text: string) => ({ text, label: 'CONDITION' })),
    ...doc.match('#Treatment').out('array').map((text: string) => ({ text, label: 'TREATMENT' })),
    ...doc.match('#Medication').out('array').map((text: string) => ({ text, label: 'MEDICATION' })),
    ...doc.match('#Anatomy').out('array').map((text: string) => ({ text, label: 'ANATOMY' })),
    ...doc.match('#Symptom').out('array').map((text: string) => ({ text, label: 'SYMPTOM' })),
    ...doc.organizations().out('array').map((text: string) => ({ text, label: 'ORGANIZATION' })),
    ...doc.people().out('array').map((text: string) => ({ text, label: 'PERSON' }))
  ];
  
  // Clinical term frequency analysis
  const clinicalTermCount = entities.length;
  const clinicalTermDensity = clinicalTermCount / tokens.length;
  
  // Analyze coverage of clinical guideline categories
  const categoryCoverage: Record<string, number> = {};
  
  for (const [category, terms] of Object.entries(clinicalGuidelines)) {
    const matchedTerms = terms.filter(term => 
      textLower.includes(term.toLowerCase()) || 
      stems.some(stem => stemmer.stem(term) === stem)
    );
    categoryCoverage[category] = Math.round((matchedTerms.length / terms.length) * 100);
  }
  
  // Sentiment analysis for patient-centered language
  const analyzer = new natural.SentimentAnalyzer('English', stemmer, 'afinn');
  const sentenceSplitter = new natural.SentenceTokenizer([]);
  const sentences = sentenceSplitter.tokenize(text);
  
  // Get sentiment for each sentence
  const sentimentScores = sentences.map(sentence => {
    const tokenizedSentence = wordTokenizer.tokenize(sentence);
    return analyzer.getSentiment(tokenizedSentence);
  });
  
  // Average sentiment score (-5 to 5 scale)
  const avgSentiment = sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length;
  
  // Calculate weighted score based on category coverage and clinical term density
  const categoryScores = Object.values(categoryCoverage);
  const avgCategoryScore = categoryScores.reduce((sum, score) => sum + score, 0) / categoryScores.length;
  
  // Combined score (45% category coverage, 35% basic keyword coverage, 10% sentiment appropriateness, 10% clinical term density)
  const sentimentAppropriateScore = 100 - Math.abs((avgSentiment * 10) - 5) * 10;
  const clinicalTermScore = Math.min(clinicalTermDensity * 1000, 100); // Cap at 100
  const finalScore = Math.round(
    avgCategoryScore * 0.45 + 
    basicScore * 0.35 + 
    sentimentAppropriateScore * 0.1 + 
    clinicalTermScore * 0.1
  );
  
  // Generate detailed feedback
  let feedback = "";
  if (finalScore >= 90) {
    feedback = "Document comprehensively meets clinical guideline criteria with excellent coverage.";
  } else if (finalScore >= 75) {
    feedback = "Document aligns well with clinical guidelines. Consider enhancing these areas: " + 
      Object.entries(categoryCoverage)
        .filter(([_, score]) => score < 70)
        .map(([category]) => category)
        .join(", ");
  } else if (finalScore >= 50) {
    feedback = "Document partially meets clinical guidelines but needs significant improvements in: " +
      Object.entries(categoryCoverage)
        .filter(([_, score]) => score < 50)
        .map(([category]) => category)
        .join(", ");
  } else {
    feedback = "Document has major gaps in clinical guideline adherence. Focus on adding elements from: " +
      Object.entries(categoryCoverage)
        .filter(([_, score]) => score < 30)
        .map(([category]) => category)
        .join(", ");
  }

  return { 
    score: finalScore, 
    missing, 
    feedback,
    entities,
    keyPhrases,
    categoryCoverage
  };
}

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Missing or invalid text" }, { status: 400 });
  }

  try {
    const result = await nlpIntegrityScore(text);

    return NextResponse.json({
      integrity_score: result.score,
      missing_elements: result.missing,
      feedback: result.feedback,
      entities: result.entities,
      key_phrases: result.keyPhrases,
      category_coverage: result.categoryCoverage
    });
  } catch (error) {
    console.error('Error processing text:', error);
    return NextResponse.json({ 
      error: "An error occurred during text analysis",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
