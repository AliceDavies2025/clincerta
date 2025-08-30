import { NextRequest, NextResponse } from 'next/server';

// Enhanced mock database of existing documents for similarity comparison
const mockDocuments = [
  {
    id: 1,
    title: "Patient Fever Case",
    content: "Patient presented with fever and cough. Prescribed antibiotics. Temperature was 102°F. Recommended rest and fluids.",
    category: "clinical"
  },
  {
    id: 2,
    title: "Chest Pain Assessment",
    content: "Patient admitted for chest pain. ECG and labs ordered. No signs of myocardial infarction. Discharged with follow-up.",
    category: "clinical"
  },
  {
    id: 3,
    title: "Routine Checkup",
    content: "Routine checkup. No abnormal findings. Patient reports feeling well. Blood pressure normal. Weight stable.",
    category: "clinical"
  },
  {
    id: 4,
    title: "Diabetes Management",
    content: "Diabetes management review. Blood glucose levels stable. Medication compliance good. No complications noted.",
    category: "clinical"
  },
  {
    id: 5,
    title: "Post-Surgery Follow-up",
    content: "Post-surgery follow-up appointment. Incision healing well. No signs of infection. Patient reports minimal pain.",
    category: "clinical"
  }
];

// Multiple similarity algorithms for comprehensive analysis
class TextSimilarityAnalyzer {
  // Jaccard similarity on word sets
  static jaccardSimilarity(a: string, b: string): number {
    const setA = new Set(a.toLowerCase().split(/\W+/).filter(word => word.length > 2));
    const setB = new Set(b.toLowerCase().split(/\W+/).filter(word => word.length > 2));
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  // Cosine similarity using TF-IDF
  static cosineSimilarity(a: string, b: string): number {
    const wordsA = a.toLowerCase().split(/\W+/).filter(word => word.length > 2);
    const wordsB = b.toLowerCase().split(/\W+/).filter(word => word.length > 2);
    
    const allWords = new Set([...wordsA, ...wordsB]);
    const vectorA = new Map();
    const vectorB = new Map();
    
    // Count word frequencies
    wordsA.forEach(word => vectorA.set(word, (vectorA.get(word) || 0) + 1));
    wordsB.forEach(word => vectorB.set(word, (vectorB.get(word) || 0) + 1));
    
    // Calculate cosine similarity
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    allWords.forEach(word => {
      const freqA = vectorA.get(word) || 0;
      const freqB = vectorB.get(word) || 0;
      dotProduct += freqA * freqB;
      normA += freqA * freqA;
      normB += freqB * freqB;
    });
    
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator > 0 ? dotProduct / denominator : 0;
  }

  // Longest Common Subsequence similarity
  static lcsSimilarity(a: string, b: string): number {
    const wordsA = a.toLowerCase().split(/\W+/).filter(word => word.length > 2);
    const wordsB = b.toLowerCase().split(/\W+/).filter(word => word.length > 2);
    
    const lcs = this.longestCommonSubsequence(wordsA, wordsB);
    const maxLength = Math.max(wordsA.length, wordsB.length);
    return maxLength > 0 ? lcs.length / maxLength : 0;
  }

  private static longestCommonSubsequence(arr1: string[], arr2: string[]): string[] {
    const m = arr1.length;
    const n = arr2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (arr1[i - 1] === arr2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }
    
    // Reconstruct the LCS
    const lcs: string[] = [];
    let i = m, j = n;
    while (i > 0 && j > 0) {
      if (arr1[i - 1] === arr2[j - 1]) {
        lcs.unshift(arr1[i - 1]);
        i--;
        j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }
    
    return lcs;
  }

  // N-gram similarity
  static ngramSimilarity(a: string, b: string, n: number = 3): number {
    const ngramsA = this.getNGrams(a.toLowerCase(), n);
    const ngramsB = this.getNGrams(b.toLowerCase(), n);
    
    const setA = new Set(ngramsA);
    const setB = new Set(ngramsB);
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private static getNGrams(text: string, n: number): string[] {
    const ngrams: string[] = [];
    for (let i = 0; i <= text.length - n; i++) {
      ngrams.push(text.substring(i, i + n));
    }
    return ngrams;
  }

  // Comprehensive similarity analysis
  static comprehensiveSimilarity(a: string, b: string) {
    const jaccard = this.jaccardSimilarity(a, b);
    const cosine = this.cosineSimilarity(a, b);
    const lcs = this.lcsSimilarity(a, b);
    const trigram = this.ngramSimilarity(a, b, 3);
    
    // Weighted average of all methods
    const weightedScore = (jaccard * 0.3 + cosine * 0.3 + lcs * 0.2 + trigram * 0.2);
    
    return {
      overall: weightedScore,
      breakdown: {
        jaccard,
        cosine,
        lcs,
        trigram
      }
    };
  }
}

// Enhanced text analysis functions
function analyzeTextComplexity(text: string) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\W+/).filter(w => w.length > 0);
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  
  return {
    sentenceCount: sentences.length,
    wordCount: words.length,
    uniqueWordCount: uniqueWords.size,
    averageSentenceLength: words.length / Math.max(sentences.length, 1),
    vocabularyDiversity: uniqueWords.size / Math.max(words.length, 1)
  };
}

function detectPlagiarismPatterns(text: string) {
  const patterns = {
    exactPhrases: 0,
    repeatedStructures: 0,
    unusualFormatting: 0
  };
  
  // Check for exact repeated phrases
  const phrases = text.toLowerCase().match(/[^.!?]+/g) || [];
  const phraseCounts = new Map<string, number>();
  
  phrases.forEach(phrase => {
    const cleanPhrase = phrase.trim();
    if (cleanPhrase.length > 20) {
      phraseCounts.set(cleanPhrase, (phraseCounts.get(cleanPhrase) || 0) + 1);
    }
  });
  
  patterns.exactPhrases = Array.from(phraseCounts.values()).filter(count => count > 1).length;
  
  return patterns;
}

export async function POST(req: NextRequest) {
  try {
  const { text } = await req.json();

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Missing or invalid text" }, { status: 400 });
  }

    // Analyze the input text
    const textAnalysis = analyzeTextComplexity(text);
    const plagiarismPatterns = detectPlagiarismPatterns(text);

    // Compare input text to each document in the database
  let maxSimilarity = 0;
    let mostSimilarDoc = null;
    let allSimilarities = [];

  for (const doc of mockDocuments) {
      const similarity = TextSimilarityAnalyzer.comprehensiveSimilarity(text, doc.content);
      
      allSimilarities.push({
        documentId: doc.id,
        title: doc.title,
        category: doc.category,
        similarity: similarity.overall,
        breakdown: similarity.breakdown
      });

      if (similarity.overall > maxSimilarity) {
        maxSimilarity = similarity.overall;
        mostSimilarDoc = {
          ...doc,
          similarity: similarity.overall,
          breakdown: similarity.breakdown
        };
      }
    }

    // Calculate originality score
    const originalityScore = Math.round(100 - (maxSimilarity * 100));
    
    // Determine risk level
    let riskLevel = "low";
    let riskDescription = "No significant similarity detected";
    
    if (maxSimilarity > 0.7) {
      riskLevel = "high";
      riskDescription = "High similarity detected. Possible cloned content.";
    } else if (maxSimilarity > 0.4) {
      riskLevel = "medium";
      riskDescription = "Moderate similarity detected. Review recommended.";
    } else if (maxSimilarity > 0.2) {
      riskLevel = "low";
      riskDescription = "Low similarity detected. Content appears original.";
    }

    // Generate detailed analysis
    const analysis = {
    originality_score: originalityScore,
      risk_level: riskLevel,
      risk_description: riskDescription,
      overall_similarity: maxSimilarity,
    most_similar_document: mostSimilarDoc,
      text_analysis: textAnalysis,
      plagiarism_patterns: plagiarismPatterns,
      all_similarities: allSimilarities.slice(0, 5), // Top 5 matches
      recommendations: generateRecommendations(maxSimilarity, textAnalysis, plagiarismPatterns)
    };

    return NextResponse.json(analysis);

  } catch (error) {
    console.error('Clonability analysis error:', error);
    return NextResponse.json(
      { error: "Failed to analyze text similarity" },
      { status: 500 }
    );
  }
}

function generateRecommendations(similarity: number, textAnalysis: any, patterns: any): string[] {
  const recommendations = [];
  
  if (similarity > 0.7) {
    recommendations.push("Consider rewriting sections with high similarity to improve originality");
    recommendations.push("Review and cite sources if content is derived from other documents");
  }
  
  if (textAnalysis.vocabularyDiversity < 0.3) {
    recommendations.push("Consider using more diverse vocabulary to improve text quality");
  }
  
  if (patterns.exactPhrases > 0) {
    recommendations.push("Avoid exact repetition of phrases throughout the document");
  }
  
  if (textAnalysis.averageSentenceLength > 25) {
    recommendations.push("Consider breaking down long sentences for better readability");
  }
  
  if (recommendations.length === 0) {
    recommendations.push("Document appears to be original and well-written");
  }
  
  return recommendations;
}
