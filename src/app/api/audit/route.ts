import { NextRequest, NextResponse } from 'next/server';

// Professional Clinical Audit Scoring System
// Comprehensive evaluation with detailed feedback, improvement suggestions, and training recommendations

// Type definitions for audit system
interface AuditCriterion {
  name: string;
  keywords: string[];
  required: string[];
  score: number;
  maxScore: number;
}

interface AuditCategory {
  name: string;
  weight: number;
  criteria: Record<string, AuditCriterion>;
}

interface CriterionResult {
  name: string;
  score: number;
  maxScore: number;
  percentage: number;
}

interface CategoryResult {
  score: number;
  breakdown: Record<string, CriterionResult>;
  feedback: string[];
}

interface AuditResults {
  overallScore: number;
  categories: Record<string, CategoryResult>;
}

interface TrainingResource {
  name: string;
  type: string;
  duration: string;
  description: string;
  url: string;
  level: string;
}

interface TrainingRecommendation {
  category: string;
  area: string;
  performance: number;
  resources: TrainingResource[];
}

// Audit Criteria Categories
const auditCriteria: Record<string, AuditCategory> = {
  documentationCompleteness: {
    name: "Documentation Completeness",
    weight: 0.25,
    criteria: {
      patientIdentification: {
        name: "Patient Identification",
        keywords: [
          'patient name', 'patient id', 'medical record number', 'mrn', 'date of birth', 'dob', 'age', 'gender',
          'demographics', 'contact information', 'emergency contact', 'insurance', 'primary care provider'
        ],
        required: ['patient identification'],
        score: 0,
        maxScore: 10
      },
      dateTimeDocumentation: {
        name: "Date/Time Documentation",
        keywords: [
          'date', 'time', 'timestamp', 'encounter date', 'visit date', 'admission date', 'discharge date',
          'assessment date', 'evaluation date', 'follow-up date', 'appointment date'
        ],
        required: ['date and time'],
        score: 0,
        maxScore: 10
      },
      providerIdentification: {
        name: "Provider Identification",
        keywords: [
          'physician', 'nurse', 'provider', 'clinician', 'attending', 'resident', 'practitioner', 'doctor',
          'nurse practitioner', 'physician assistant', 'pa', 'np', 'rn', 'lpn', 'cna'
        ],
        required: ['provider identification'],
        score: 0,
        maxScore: 10
      },
      chiefComplaint: {
        name: "Chief Complaint",
        keywords: [
          'chief complaint', 'cc', 'presenting problem', 'reason for visit', 'primary concern', 'main complaint',
          'patient reports', 'patient states', 'patient complains', 'patient describes'
        ],
        required: ['chief complaint'],
        score: 0,
        maxScore: 15
      },
      historyOfPresentIllness: {
        name: "History of Present Illness",
        keywords: [
          'history of present illness', 'hpi', 'present illness', 'current illness', 'illness history',
          'symptom progression', 'symptom timeline', 'symptom evolution', 'associated symptoms'
        ],
        required: ['history of present illness'],
        score: 0,
        maxScore: 15
      },
      physicalExamination: {
        name: "Physical Examination",
        keywords: [
          'physical examination', 'physical exam', 'pe', 'examination findings', 'clinical findings',
          'vital signs', 'blood pressure', 'temperature', 'heart rate', 'respiratory rate'
        ],
        required: ['physical examination'],
        score: 0,
        maxScore: 15
      },
      assessment: {
        name: "Assessment/Diagnosis",
        keywords: [
          'assessment', 'impression', 'diagnosis', 'diagnostic impression', 'clinical impression',
          'working diagnosis', 'differential diagnosis', 'problem list'
        ],
        required: ['assessment'],
        score: 0,
        maxScore: 15
      },
      plan: {
        name: "Treatment Plan",
        keywords: [
          'plan', 'treatment plan', 'care plan', 'management plan', 'intervention plan',
          'recommendations', 'next steps', 'follow-up plan', 'discharge plan'
        ],
        required: ['treatment plan'],
        score: 0,
        maxScore: 15
      }
    }
  },

  clinicalAccuracy: {
    name: "Clinical Accuracy",
    weight: 0.25,
    criteria: {
      medicalTerminology: {
        name: "Medical Terminology",
        keywords: [
          'diagnosis', 'symptoms', 'treatment', 'medication', 'procedure', 'assessment', 'evaluation',
          'clinical', 'medical', 'therapeutic', 'pharmacological', 'intervention'
        ],
        required: ['medical terminology'],
        score: 0,
        maxScore: 20
      },
      clinicalReasoning: {
        name: "Clinical Reasoning",
        keywords: [
          'clinical reasoning', 'diagnostic reasoning', 'assessment', 'evaluation', 'impression',
          'differential diagnosis', 'ruling out', 'ruling in', 'clinical correlation'
        ],
        required: ['clinical reasoning'],
        score: 0,
        maxScore: 20
      },
      evidenceBasedPractice: {
        name: "Evidence-Based Practice",
        keywords: [
          'evidence-based', 'clinical guidelines', 'best practice', 'protocol', 'standard of care',
          'recommendations', 'evidence-based medicine', 'clinical evidence'
        ],
        required: ['evidence-based practice'],
        score: 0,
        maxScore: 20
      },
      patientCenteredCare: {
        name: "Patient-Centered Care",
        keywords: [
          'patient-centered', 'patient preferences', 'shared decision making', 'patient goals',
          'patient values', 'patient satisfaction', 'patient experience'
        ],
        required: ['patient-centered care'],
        score: 0,
        maxScore: 20
      },
      safetyConsiderations: {
        name: "Safety Considerations",
        keywords: [
          'safety', 'risk assessment', 'allergies', 'medications', 'vital signs', 'patient safety',
          'safety measures', 'safety protocols', 'fall risk', 'infection control'
        ],
        required: ['safety considerations'],
        score: 0,
        maxScore: 20
      }
    }
  },

  documentationQuality: {
    name: "Documentation Quality",
    weight: 0.20,
    criteria: {
      clarity: {
        name: "Clarity and Readability",
        keywords: [
          'clear', 'concise', 'readable', 'understandable', 'well-organized', 'structured',
          'logical flow', 'coherent', 'comprehensive', 'detailed'
        ],
        required: ['clarity'],
        score: 0,
        maxScore: 25
      },
      completeness: {
        name: "Completeness",
        keywords: [
          'complete', 'comprehensive', 'thorough', 'detailed', 'full', 'extensive',
          'all inclusive', 'comprehensive assessment', 'complete evaluation'
        ],
        required: ['completeness'],
        score: 0,
        maxScore: 25
      },
      consistency: {
        name: "Consistency",
        keywords: [
          'consistent', 'uniform', 'standardized', 'systematic', 'regular', 'reliable',
          'consistent format', 'standard format', 'uniform documentation'
        ],
        required: ['consistency'],
        score: 0,
        maxScore: 25
      },
      timeliness: {
        name: "Timeliness",
        keywords: [
          'timely', 'prompt', 'immediate', 'current', 'up-to-date', 'real-time',
          'timely documentation', 'prompt recording', 'immediate documentation'
        ],
        required: ['timeliness'],
        score: 0,
        maxScore: 25
      }
    }
  },

  complianceStandards: {
    name: "Compliance Standards",
    weight: 0.15,
    criteria: {
      regulatoryCompliance: {
        name: "Regulatory Compliance",
        keywords: [
          'regulatory', 'compliance', 'standards', 'guidelines', 'requirements', 'policies',
          'procedures', 'protocols', 'accreditation', 'joint commission'
        ],
        required: ['regulatory compliance'],
        score: 0,
        maxScore: 30
      },
      legalRequirements: {
        name: "Legal Requirements",
        keywords: [
          'legal', 'legal requirements', 'legal documentation', 'legal standards', 'legal compliance',
          'legal obligations', 'legal responsibilities', 'legal framework'
        ],
        required: ['legal requirements'],
        score: 0,
        maxScore: 30
      },
      privacySecurity: {
        name: "Privacy and Security",
        keywords: [
          'privacy', 'security', 'confidentiality', 'hipaa', 'patient privacy', 'data security',
          'information security', 'confidential', 'protected health information', 'phi'
        ],
        required: ['privacy and security'],
        score: 0,
        maxScore: 40
      }
    }
  },

  professionalStandards: {
    name: "Professional Standards",
    weight: 0.15,
    criteria: {
      professionalLanguage: {
        name: "Professional Language",
        keywords: [
          'professional', 'professional language', 'professional terminology', 'professional communication',
          'professional documentation', 'professional standards', 'professional practice'
        ],
        required: ['professional language'],
        score: 0,
        maxScore: 25
      },
      ethicalConsiderations: {
        name: "Ethical Considerations",
        keywords: [
          'ethical', 'ethics', 'ethical considerations', 'ethical practice', 'ethical standards',
          'ethical principles', 'ethical guidelines', 'ethical obligations'
        ],
        required: ['ethical considerations'],
        score: 0,
        maxScore: 25
      },
      interdisciplinaryCollaboration: {
        name: "Interdisciplinary Collaboration",
        keywords: [
          'interdisciplinary', 'collaboration', 'team approach', 'multidisciplinary', 'interprofessional',
          'team-based care', 'care coordination', 'care management', 'case management'
        ],
        required: ['interdisciplinary collaboration'],
        score: 0,
        maxScore: 25
      },
      continuingEducation: {
        name: "Continuing Education",
        keywords: [
          'continuing education', 'professional development', 'training', 'education', 'learning',
          'skill development', 'competency', 'knowledge', 'expertise'
        ],
        required: ['continuing education'],
        score: 0,
        maxScore: 25
      }
    }
  }
};

// Training Resources Database
const trainingResources: Record<string, {
  title: string;
  resources: TrainingResource[];
}> = {
  documentationCompleteness: {
    title: "Documentation Completeness Training",
    resources: [
      {
        name: "SOAP Documentation Framework",
        type: "Course",
        duration: "2 hours",
        description: "Learn the Subjective, Objective, Assessment, Plan framework for comprehensive documentation",
        url: "https://example.com/soap-documentation",
        level: "Beginner"
      },
      {
        name: "Clinical Documentation Standards",
        type: "Webinar",
        duration: "1.5 hours",
        description: "Understanding clinical documentation requirements and best practices",
        url: "https://example.com/clinical-standards",
        level: "Intermediate"
      },
      {
        name: "Patient Assessment Documentation",
        type: "Workshop",
        duration: "4 hours",
        description: "Hands-on training for comprehensive patient assessment documentation",
        url: "https://example.com/patient-assessment",
        level: "Advanced"
      }
    ]
  },
  clinicalAccuracy: {
    title: "Clinical Accuracy Training",
    resources: [
      {
        name: "Medical Terminology Mastery",
        type: "Course",
        duration: "3 hours",
        description: "Comprehensive medical terminology training for accurate documentation",
        url: "https://example.com/medical-terminology",
        level: "Beginner"
      },
      {
        name: "Clinical Reasoning Skills",
        type: "Workshop",
        duration: "6 hours",
        description: "Develop clinical reasoning skills for accurate diagnosis and documentation",
        url: "https://example.com/clinical-reasoning",
        level: "Intermediate"
      },
      {
        name: "Evidence-Based Practice Implementation",
        type: "Course",
        duration: "4 hours",
        description: "Learn to incorporate evidence-based practices in clinical documentation",
        url: "https://example.com/evidence-based",
        level: "Advanced"
      }
    ]
  },
  documentationQuality: {
    title: "Documentation Quality Training",
    resources: [
      {
        name: "Writing Clear Clinical Notes",
        type: "Workshop",
        duration: "3 hours",
        description: "Learn to write clear, concise, and comprehensive clinical documentation",
        url: "https://example.com/clear-notes",
        level: "Beginner"
      },
      {
        name: "Documentation Consistency Training",
        type: "Course",
        duration: "2 hours",
        description: "Standardize documentation practices for consistency across the organization",
        url: "https://example.com/consistency",
        level: "Intermediate"
      },
      {
        name: "Advanced Documentation Techniques",
        type: "Workshop",
        duration: "5 hours",
        description: "Advanced techniques for high-quality clinical documentation",
        url: "https://example.com/advanced-docs",
        level: "Advanced"
      }
    ]
  },
  complianceStandards: {
    title: "Compliance Standards Training",
    resources: [
      {
        name: "HIPAA Compliance Training",
        type: "Course",
        duration: "2 hours",
        description: "Essential HIPAA compliance training for healthcare documentation",
        url: "https://example.com/hipaa-training",
        level: "Beginner"
      },
      {
        name: "Regulatory Compliance Overview",
        type: "Webinar",
        duration: "1.5 hours",
        description: "Overview of regulatory requirements for clinical documentation",
        url: "https://example.com/regulatory-overview",
        level: "Intermediate"
      },
      {
        name: "Legal Documentation Requirements",
        type: "Workshop",
        duration: "4 hours",
        description: "Understanding legal requirements and documentation standards",
        url: "https://example.com/legal-requirements",
        level: "Advanced"
      }
    ]
  },
  professionalStandards: {
    title: "Professional Standards Training",
    resources: [
      {
        name: "Professional Communication Skills",
        type: "Course",
        duration: "3 hours",
        description: "Develop professional communication skills for clinical documentation",
        url: "https://example.com/professional-communication",
        level: "Beginner"
      },
      {
        name: "Ethical Documentation Practices",
        type: "Workshop",
        duration: "2.5 hours",
        description: "Learn ethical considerations in clinical documentation",
        url: "https://example.com/ethical-practices",
        level: "Intermediate"
      },
      {
        name: "Interdisciplinary Team Documentation",
        type: "Course",
        duration: "4 hours",
        description: "Documentation practices for interdisciplinary team collaboration",
        url: "https://example.com/interdisciplinary",
        level: "Advanced"
      }
    ]
  }
};

// Professional Audit Analyzer
class ClinicalAuditAnalyzer {
  private text: string;
  private textLower: string;
  private sentences: string[];
  private words: string[];

  constructor(text: string) {
    this.text = text;
    this.textLower = text.toLowerCase();
    this.sentences = this.splitIntoSentences(text);
    this.words = this.tokenizeWords(text);
  }

  private splitIntoSentences(text: string): string[] {
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  }

  private tokenizeWords(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
  }

  private calculateCriterionScore(criterion: AuditCriterion): number {
    const foundKeywords = criterion.keywords.filter((keyword: string) => 
      this.textLower.includes(keyword.toLowerCase())
    );
    
    const foundRequired = criterion.required.filter((required: string) => 
      this.textLower.includes(required.toLowerCase())
    );
    
    // Calculate score based on keyword presence and required elements
    const keywordScore = (foundKeywords.length / criterion.keywords.length) * 60;
    const requiredScore = (foundRequired.length / criterion.required.length) * 40;
    
    return Math.round((keywordScore + requiredScore) * criterion.maxScore / 100);
  }

  private analyzeCategory(category: AuditCategory): CategoryResult {
    const breakdown: Record<string, CriterionResult> = {};
    const feedback: string[] = [];
    let totalScore = 0;
    let maxPossibleScore = 0;

    for (const [criterionKey, criterion] of Object.entries(category.criteria)) {
      const score = this.calculateCriterionScore(criterion);
      breakdown[criterionKey] = {
        name: criterion.name,
        score,
        maxScore: criterion.maxScore,
        percentage: Math.round((score / criterion.maxScore) * 100)
      };
      
      totalScore += score;
      maxPossibleScore += criterion.maxScore;
      
      // Generate feedback based on score
      if (score < criterion.maxScore * 0.5) {
        feedback.push(`Needs improvement in ${criterion.name.toLowerCase()}`);
      } else if (score < criterion.maxScore * 0.8) {
        feedback.push(`Moderate performance in ${criterion.name.toLowerCase()}`);
  } else {
        feedback.push(`Good performance in ${criterion.name.toLowerCase()}`);
      }
    }

    return {
      score: totalScore,
      breakdown,
      feedback
    };
  }

  private generateImprovementSuggestions(auditResults: AuditResults): string[] {
    const suggestions: string[] = [];
    
    // Analyze each category and generate specific suggestions
    for (const [categoryKey, categoryResult] of Object.entries(auditResults.categories)) {
      const category = auditCriteria[categoryKey as keyof typeof auditCriteria];
      const breakdown = categoryResult.breakdown;
      
      for (const [criterionKey, criterionResult] of Object.entries(breakdown)) {
        const criterion = category.criteria[criterionKey as keyof typeof category.criteria];
        
        if ((criterionResult as CriterionResult).percentage < 50) {
          suggestions.push(`Enhance ${criterion.name.toLowerCase()} by including more comprehensive ${criterion.name.toLowerCase()} elements`);
        } else if ((criterionResult as CriterionResult).percentage < 80) {
          suggestions.push(`Improve ${criterion.name.toLowerCase()} by expanding on existing ${criterion.name.toLowerCase()} content`);
        }
      }
    }

    // Add general suggestions based on overall performance
    if (auditResults.overallScore < 60) {
      suggestions.push("Consider comprehensive documentation training to improve overall quality");
      suggestions.push("Implement documentation templates to ensure consistency");
    } else if (auditResults.overallScore < 80) {
      suggestions.push("Focus on specific areas of weakness identified in the audit");
      suggestions.push("Review and update documentation practices regularly");
  } else {
      suggestions.push("Maintain current high standards and consider advanced training opportunities");
    }

    return suggestions.slice(0, 10); // Limit to top 10 suggestions
  }

  private generateTrainingRecommendations(auditResults: AuditResults): TrainingRecommendation[] {
    const recommendations: TrainingRecommendation[] = [];
    
    // Identify areas needing improvement
    for (const [categoryKey, categoryResult] of Object.entries(auditResults.categories)) {
      const category = auditCriteria[categoryKey as keyof typeof auditCriteria];
      const breakdown = categoryResult.breakdown;
      
      // Find the lowest scoring criterion in this category
      let lowestScore = 100;
      let lowestCriterion = '';
      
      for (const [criterionKey, criterionResult] of Object.entries(breakdown)) {
        if ((criterionResult as CriterionResult).percentage < lowestScore) {
          lowestScore = (criterionResult as CriterionResult).percentage;
          lowestCriterion = criterionKey;
        }
      }
      
      // If any criterion has low performance, recommend training
      if (lowestScore < 70) {
        const trainingCategory = trainingResources[categoryKey as keyof typeof trainingResources];
        if (trainingCategory) {
          // Select appropriate training resource based on performance level
          let level = "Beginner";
          if (lowestScore > 40) level = "Intermediate";
          if (lowestScore > 60) level = "Advanced";
          
          const relevantResources = trainingCategory.resources.filter(r => r.level === level);
          if (relevantResources.length > 0) {
            recommendations.push({
              category: category.name,
              area: lowestCriterion,
              performance: lowestScore,
              resources: relevantResources.slice(0, 2) // Top 2 resources
            });
          }
        }
      }
    }

    return recommendations;
  }

  private generateDetailedFeedback(auditResults: AuditResults): string[] {
    const feedback: string[] = [];
    
    // Overall performance feedback
    if (auditResults.overallScore >= 90) {
      feedback.push("Excellent documentation quality with comprehensive coverage of all audit criteria");
    } else if (auditResults.overallScore >= 80) {
      feedback.push("Good documentation quality with minor areas for improvement");
    } else if (auditResults.overallScore >= 70) {
      feedback.push("Satisfactory documentation quality with several areas needing attention");
    } else if (auditResults.overallScore >= 60) {
      feedback.push("Documentation quality needs improvement in multiple areas");
  } else {
      feedback.push("Significant improvements needed in documentation quality and completeness");
    }

    // Category-specific feedback
    for (const [categoryKey, categoryResult] of Object.entries(auditResults.categories)) {
      const category = auditCriteria[categoryKey as keyof typeof auditCriteria];
      const score = categoryResult.score;
      const maxScore = Object.values(category.criteria).reduce((sum: number, criterion: AuditCriterion) => sum + criterion.maxScore, 0);
      const percentage = Math.round((score / maxScore) * 100);
      
      if (percentage < 60) {
        feedback.push(`${category.name} needs significant improvement (${percentage}% score)`);
      } else if (percentage < 80) {
        feedback.push(`${category.name} has room for improvement (${percentage}% score)`);
  } else {
        feedback.push(`${category.name} demonstrates good performance (${percentage}% score)`);
      }
    }

    return feedback;
  }

  public analyze(): any {
    const categories: Record<string, CategoryResult> = {};
    let totalScore = 0;
    let maxPossibleScore = 0;

    // Analyze each category
    for (const [categoryKey, category] of Object.entries(auditCriteria)) {
      const categoryResult = this.analyzeCategory(category);
      categories[categoryKey] = categoryResult;
      
      totalScore += categoryResult.score * category.weight;
      maxPossibleScore += Object.values(category.criteria).reduce((sum: number, criterion: AuditCriterion) => sum + criterion.maxScore, 0) * category.weight;
    }

    const overallScore = Math.round((totalScore / maxPossibleScore) * 100);
    
    const auditResults: AuditResults = {
      overallScore,
      categories
    };

    const feedback = this.generateDetailedFeedback(auditResults);
    const suggestions = this.generateImprovementSuggestions(auditResults);
    const trainingRecommendations = this.generateTrainingRecommendations(auditResults);

  return {
      audit_score: overallScore,
    feedback,
    suggestions,
      training_recommendations: trainingRecommendations,
      detailed_analysis: {
        categories,
        total_score: totalScore,
        max_possible_score: maxPossibleScore
      }
    };
  }
}

export async function POST(req: NextRequest) {
  try {
  const { text } = await req.json();

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Missing or invalid text" }, { status: 400 });
  }

    // Perform comprehensive clinical audit analysis
    const analyzer = new ClinicalAuditAnalyzer(text);
    const result = analyzer.analyze();

  return NextResponse.json(result);
    
  } catch (error) {
    console.error('Clinical audit analysis error:', error);
    return NextResponse.json(
      { error: "Failed to analyze clinical audit" },
      { status: 500 }
    );
  }
}
