import { NextRequest, NextResponse } from 'next/server';

// Professional Golden Thread Compliance Analysis System
// Ensures documentation connects patient care actions with relevant interventions

// Comprehensive Clinical Documentation Sections
const clinicalSections = {
  patientIdentification: {
    keywords: [
      'patient name', 'patient id', 'medical record number', 'mrn', 'date of birth', 'dob', 'age', 'gender', 'sex',
      'demographics', 'contact information', 'emergency contact', 'insurance', 'primary care provider', 'pcp'
    ],
    required: ['patient identification'],
    weight: 0.10
  },
  
  chiefComplaint: {
    keywords: [
      'chief complaint', 'cc', 'presenting problem', 'reason for visit', 'primary concern', 'main complaint',
      'patient reports', 'patient states', 'patient complains', 'patient describes', 'patient indicates',
      'symptom onset', 'duration of symptoms', 'severity of symptoms', 'aggravating factors', 'alleviating factors'
    ],
    required: ['chief complaint'],
    weight: 0.15
  },
  
  historyOfPresentIllness: {
    keywords: [
      'history of present illness', 'hpi', 'present illness', 'current illness', 'illness history',
      'symptom progression', 'symptom timeline', 'symptom evolution', 'associated symptoms', 'related symptoms',
      'previous episodes', 'similar episodes', 'symptom pattern', 'symptom frequency', 'symptom intensity'
    ],
    required: ['history of present illness'],
    weight: 0.15
  },
  
  pastMedicalHistory: {
    keywords: [
      'past medical history', 'pmh', 'medical history', 'previous medical history', 'chronic conditions',
      'comorbidities', 'past illnesses', 'previous diagnoses', 'medical conditions', 'health history',
      'surgical history', 'hospitalizations', 'allergies', 'medication history', 'family history'
    ],
    required: ['past medical history'],
    weight: 0.10
  },
  
  physicalExamination: {
    keywords: [
      'physical examination', 'physical exam', 'pe', 'examination findings', 'clinical findings', 'objective findings',
      'vital signs', 'blood pressure', 'temperature', 'heart rate', 'respiratory rate', 'oxygen saturation',
      'general appearance', 'mental status', 'cardiovascular exam', 'respiratory exam', 'abdominal exam',
      'neurological exam', 'musculoskeletal exam', 'skin exam', 'head and neck exam'
    ],
    required: ['physical examination'],
    weight: 0.15
  },
  
  assessment: {
    keywords: [
      'assessment', 'impression', 'diagnosis', 'diagnostic impression', 'clinical impression', 'working diagnosis',
      'differential diagnosis', 'problem list', 'clinical assessment', 'medical assessment', 'nursing assessment',
      'severity assessment', 'acuity level', 'risk assessment', 'clinical reasoning', 'diagnostic reasoning'
    ],
    required: ['assessment'],
    weight: 0.15
  },
  
  plan: {
    keywords: [
      'plan', 'treatment plan', 'care plan', 'management plan', 'intervention plan', 'therapeutic plan',
      'recommendations', 'next steps', 'follow-up plan', 'discharge plan', 'transition plan', 'care coordination',
      'patient education', 'lifestyle modifications', 'preventive measures', 'monitoring plan'
    ],
    required: ['plan'],
    weight: 0.15
  },
  
  interventions: {
    keywords: [
      'interventions', 'treatments', 'procedures', 'therapies', 'medications', 'prescriptions', 'drug therapy',
      'pharmacological therapy', 'non-pharmacological therapy', 'surgical interventions', 'medical procedures',
      'diagnostic procedures', 'therapeutic procedures', 'nursing interventions', 'clinical interventions'
    ],
    required: ['interventions'],
    weight: 0.15
  }
};

// Professional Patient Care Actions
const patientCareActions = {
  assessment: {
    keywords: [
      'assess', 'assessment', 'evaluate', 'evaluation', 'examine', 'examination', 'review', 'analyze',
      'monitor', 'monitoring', 'observe', 'observation', 'measure', 'measurement', 'check', 'checking',
      'screen', 'screening', 'test', 'testing', 'investigate', 'investigation', 'assess risk', 'risk assessment'
    ],
    category: 'Assessment Actions',
    weight: 0.25
  },
  
  communication: {
    keywords: [
      'communicate', 'communication', 'discuss', 'discussion', 'explain', 'explanation', 'educate', 'education',
      'inform', 'information', 'counsel', 'counseling', 'advise', 'advice', 'teach', 'teaching', 'instruct',
      'instruction', 'notify', 'notification', 'report', 'reporting', 'document', 'documentation'
    ],
    category: 'Communication Actions',
    weight: 0.20
  },
  
  coordination: {
    keywords: [
      'coordinate', 'coordination', 'arrange', 'arrangement', 'schedule', 'scheduling', 'refer', 'referral',
      'consult', 'consultation', 'collaborate', 'collaboration', 'organize', 'organization', 'plan', 'planning',
      'facilitate', 'facilitation', 'manage', 'management', 'oversee', 'oversight', 'supervise', 'supervision'
    ],
    category: 'Coordination Actions',
    weight: 0.20
  },
  
  intervention: {
    keywords: [
      'intervene', 'intervention', 'treat', 'treatment', 'administer', 'administration', 'perform', 'performance',
      'conduct', 'conducting', 'implement', 'implementation', 'execute', 'execution', 'apply', 'application',
      'deliver', 'delivery', 'provide', 'provision', 'offer', 'offering', 'initiate', 'initiation'
    ],
    category: 'Intervention Actions',
    weight: 0.25
  },
  
  monitoring: {
    keywords: [
      'monitor', 'monitoring', 'track', 'tracking', 'follow', 'following', 'observe', 'observation', 'watch',
      'watching', 'surveil', 'surveillance', 'supervise', 'supervision', 'oversee', 'oversight', 'check',
      'checking', 'verify', 'verification', 'confirm', 'confirmation', 'validate', 'validation'
    ],
    category: 'Monitoring Actions',
    weight: 0.10
  }
};

// Professional Clinical Interventions
const clinicalInterventions = {
  pharmacological: {
    keywords: [
      'medication', 'drug', 'prescription', 'pharmacotherapy', 'medication therapy', 'drug therapy',
      'antibiotic', 'analgesic', 'anticoagulant', 'antihypertensive', 'antidiabetic', 'antidepressant',
      'antipsychotic', 'bronchodilator', 'corticosteroid', 'diuretic', 'insulin', 'chemotherapy',
      'dose', 'dosage', 'frequency', 'duration', 'route', 'administration', 'titration', 'adjustment'
    ],
    category: 'Pharmacological Interventions',
    weight: 0.30
  },
  
  procedural: {
    keywords: [
      'procedure', 'surgical procedure', 'medical procedure', 'diagnostic procedure', 'therapeutic procedure',
      'surgery', 'operation', 'biopsy', 'endoscopy', 'catheterization', 'intubation', 'ventilation',
      'dialysis', 'transfusion', 'infusion', 'injection', 'aspiration', 'drainage', 'debridement',
      'wound care', 'dressing change', 'suturing', 'stapling', 'bandaging', 'splinting', 'casting'
    ],
    category: 'Procedural Interventions',
    weight: 0.25
  },
  
  therapeutic: {
    keywords: [
      'therapy', 'therapeutic intervention', 'physical therapy', 'occupational therapy', 'speech therapy',
      'respiratory therapy', 'cardiac rehabilitation', 'pulmonary rehabilitation', 'pain management',
      'wound therapy', 'pressure therapy', 'compression therapy', 'heat therapy', 'cold therapy',
      'electrical stimulation', 'ultrasound therapy', 'radiation therapy', 'phototherapy', 'hydrotherapy'
    ],
    category: 'Therapeutic Interventions',
    weight: 0.20
  },
  
  educational: {
    keywords: [
      'education', 'patient education', 'health education', 'counseling', 'patient counseling',
      'instruction', 'teaching', 'training', 'guidance', 'advice', 'recommendations', 'information',
      'discharge teaching', 'medication teaching', 'dietary instruction', 'exercise instruction',
      'lifestyle counseling', 'smoking cessation', 'weight management', 'diabetes education'
    ],
    category: 'Educational Interventions',
    weight: 0.15
  },
  
  preventive: {
    keywords: [
      'prevention', 'preventive care', 'prophylaxis', 'immunization', 'vaccination', 'screening',
      'early detection', 'risk reduction', 'health promotion', 'wellness', 'preventive measures',
      'infection prevention', 'fall prevention', 'pressure ulcer prevention', 'deep vein thrombosis prevention',
      'aspiration prevention', 'complication prevention', 'readmission prevention'
    ],
    category: 'Preventive Interventions',
    weight: 0.10
  }
};

// Golden Thread Connection Patterns
const goldenThreadConnections = [
  // Core Clinical Pathway Connections
  { from: 'chiefComplaint', to: 'assessment', type: 'diagnostic', weight: 0.20 },
  { from: 'assessment', to: 'plan', type: 'therapeutic', weight: 0.20 },
  { from: 'plan', to: 'interventions', type: 'implementation', weight: 0.20 },
  
  // Historical Context Connections
  { from: 'pastMedicalHistory', to: 'assessment', type: 'contextual', weight: 0.15 },
  { from: 'historyOfPresentIllness', to: 'assessment', type: 'diagnostic', weight: 0.15 },
  
  // Physical Examination Connections
  { from: 'physicalExamination', to: 'assessment', type: 'diagnostic', weight: 0.15 },
  { from: 'physicalExamination', to: 'plan', type: 'therapeutic', weight: 0.10 },
  
  // Action-Intervention Connections
  { from: 'assessment', to: 'interventions', type: 'action-intervention', weight: 0.20 },
  { from: 'plan', to: 'interventions', type: 'action-intervention', weight: 0.20 }
];

// Professional Golden Thread Analyzer
class GoldenThreadAnalyzer {
  private text: string;
  private textLower: string;
  private sentences: string[];
  private paragraphs: string[];

  constructor(text: string) {
    this.text = text;
    this.textLower = text.toLowerCase();
    this.sentences = this.splitIntoSentences(text);
    this.paragraphs = this.splitIntoParagraphs(text);
  }

  private splitIntoSentences(text: string): string[] {
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  }

  private splitIntoParagraphs(text: string): string[] {
    return text.split(/\n\n|\r\n\r\n/).map(p => p.trim()).filter(p => p.length > 0);
  }

  private extractSectionContent(sectionKeywords: string[]): string[] {
    const relevantSentences: string[] = [];
    
    for (const sentence of this.sentences) {
      const sentenceLower = sentence.toLowerCase();
      if (sectionKeywords.some(keyword => sentenceLower.includes(keyword))) {
        relevantSentences.push(sentence);
      }
    }
    
    return relevantSentences;
  }

  private analyzeSectionCoverage(): { 
    coverage: Record<string, { present: boolean; content: string[]; score: number }>;
    overallScore: number;
    missingSections: string[];
  } {
    const coverage: Record<string, { present: boolean; content: string[]; score: number }> = {};
    let totalScore = 0;
    const missingSections: string[] = [];

    for (const [sectionName, sectionConfig] of Object.entries(clinicalSections)) {
      const content = this.extractSectionContent(sectionConfig.keywords);
      const present = content.length > 0;
      const score = present ? Math.min(content.length * 10, 100) : 0;
      
      coverage[sectionName] = {
        present,
        content,
        score
      };
      
      totalScore += score * sectionConfig.weight;
      
      if (!present) {
        missingSections.push(sectionName);
      }
    }

    return {
      coverage,
      overallScore: Math.round(totalScore),
      missingSections
    };
  }

  private analyzePatientCareActions(): {
    actions: Record<string, { found: string[]; count: number; score: number }>;
    totalActions: number;
  } {
    const actions: Record<string, { found: string[]; count: number; score: number }> = {};
    let totalActions = 0;

    for (const [actionType, actionConfig] of Object.entries(patientCareActions)) {
      const found: string[] = [];
      
      for (const keyword of actionConfig.keywords) {
        if (this.textLower.includes(keyword.toLowerCase())) {
          found.push(keyword);
        }
      }
      
      const count = found.length;
      const score = Math.min(count * 20, 100);
      
      actions[actionType] = {
        found,
        count,
        score
      };
      
      totalActions += count;
    }

    return { actions, totalActions };
  }

  private analyzeClinicalInterventions(): {
    interventions: Record<string, { found: string[]; count: number; score: number }>;
    totalInterventions: number;
  } {
    const interventions: Record<string, { found: string[]; count: number; score: number }> = {};
    let totalInterventions = 0;

    for (const [interventionType, interventionConfig] of Object.entries(clinicalInterventions)) {
      const found: string[] = [];
      
      for (const keyword of interventionConfig.keywords) {
        if (this.textLower.includes(keyword.toLowerCase())) {
          found.push(keyword);
        }
      }
      
      const count = found.length;
      const score = Math.min(count * 15, 100);
      
      interventions[interventionType] = {
        found,
        count,
        score
      };
      
      totalInterventions += count;
    }

    return { interventions, totalInterventions };
  }

  private analyzeGoldenThreadConnections(): {
    connections: Array<{ from: string; to: string; type: string; present: boolean; strength: number }>;
    connectionScore: number;
    missingConnections: string[];
    strongConnections: string[];
  } {
    const connections: Array<{ from: string; to: string; type: string; present: boolean; strength: number }> = [];
    const missingConnections: string[] = [];
    const strongConnections: string[] = [];
    let totalStrength = 0;

    for (const connection of goldenThreadConnections) {
      const fromSection = clinicalSections[connection.from as keyof typeof clinicalSections];
      const toSection = clinicalSections[connection.to as keyof typeof clinicalSections];
      
      if (!fromSection || !toSection) continue;

      const fromContent = this.extractSectionContent(fromSection.keywords);
      const toContent = this.extractSectionContent(toSection.keywords);
      
      const present = fromContent.length > 0 && toContent.length > 0;
      const strength = this.calculateConnectionStrength(fromContent, toContent, connection.type);
      
      connections.push({
        from: connection.from,
        to: connection.to,
        type: connection.type,
        present,
        strength
      });
      
      if (present && strength > 0.5) {
        strongConnections.push(`${connection.from}-to-${connection.to}`);
        totalStrength += strength * connection.weight;
      } else {
        missingConnections.push(`${connection.from}-to-${connection.to}`);
      }
    }

    const connectionScore = Math.round(totalStrength * 100);

  return { 
      connections,
    connectionScore,
    missingConnections,
      strongConnections
    };
  }

  private calculateConnectionStrength(fromContent: string[], toContent: string[], connectionType: string): number {
    if (fromContent.length === 0 || toContent.length === 0) return 0;

    let strength = 0;
    const fromText = fromContent.join(' ').toLowerCase();
    const toText = toContent.join(' ').toLowerCase();

    // Semantic similarity based on connection type
    switch (connectionType) {
      case 'diagnostic':
        // Check for diagnostic reasoning connections
        const diagnosticKeywords = ['diagnosis', 'assessment', 'impression', 'finding', 'result'];
        strength += this.calculateKeywordOverlap(fromText, toText, diagnosticKeywords);
        break;
        
      case 'therapeutic':
        // Check for treatment planning connections
        const therapeuticKeywords = ['treatment', 'plan', 'intervention', 'therapy', 'management'];
        strength += this.calculateKeywordOverlap(fromText, toText, therapeuticKeywords);
        break;
        
      case 'action-intervention':
        // Check for action-to-intervention connections
        const actionKeywords = ['assess', 'evaluate', 'monitor', 'observe', 'check'];
        const interventionKeywords = ['treat', 'administer', 'perform', 'provide', 'deliver'];
        strength += this.calculateActionInterventionConnection(fromText, toText, actionKeywords, interventionKeywords);
        break;
        
      default:
        // General semantic similarity
        strength += this.calculateGeneralSimilarity(fromText, toText);
    }

    return Math.min(strength, 1.0);
  }

  private calculateKeywordOverlap(text1: string, text2: string, keywords: string[]): number {
    const words1 = text1.split(/\W+/).filter(w => w.length > 3);
    const words2 = text2.split(/\W+/).filter(w => w.length > 3);
    
    const matchingKeywords = keywords.filter(keyword => 
      words1.includes(keyword) && words2.includes(keyword)
    );
    
    return matchingKeywords.length / keywords.length;
  }

  private calculateActionInterventionConnection(actionText: string, interventionText: string, 
                                             actionKeywords: string[], interventionKeywords: string[]): number {
    const actionPresent = actionKeywords.some(keyword => actionText.includes(keyword));
    const interventionPresent = interventionKeywords.some(keyword => interventionText.includes(keyword));
    
    if (actionPresent && interventionPresent) {
      return 0.8; // Strong connection when both actions and interventions are present
    } else if (actionPresent || interventionPresent) {
      return 0.3; // Weak connection when only one is present
    }
    
    return 0;
  }

  private calculateGeneralSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(/\W+/).filter(w => w.length > 3));
    const words2 = new Set(text2.split(/\W+/).filter(w => w.length > 3));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private generateProfessionalFeedback(
    sectionCoverage: any,
    actions: any,
    interventions: any,
    connections: any
  ): string {
    let feedback = '';
    
    // Section coverage feedback
    if (sectionCoverage.overallScore >= 80) {
      feedback += 'Excellent documentation structure with comprehensive section coverage. ';
    } else if (sectionCoverage.overallScore >= 60) {
      feedback += 'Good documentation structure with most essential sections present. ';
    } else {
      feedback += 'Documentation structure needs improvement with several key sections missing. ';
    }

    // Golden thread connection feedback
    if (connections.connectionScore >= 80) {
      feedback += 'Strong golden thread compliance with clear connections between patient care actions and interventions. ';
    } else if (connections.connectionScore >= 60) {
      feedback += 'Moderate golden thread compliance with some connections between actions and interventions. ';
    } else {
      feedback += 'Weak golden thread compliance with limited connections between actions and interventions. ';
    }

    // Action-intervention feedback
    if (actions.totalActions > 0 && interventions.totalInterventions > 0) {
      feedback += `Document effectively connects ${actions.totalActions} patient care actions with ${interventions.totalInterventions} clinical interventions. `;
    } else if (actions.totalActions === 0) {
      feedback += 'Patient care actions are not clearly documented. ';
    } else if (interventions.totalInterventions === 0) {
      feedback += 'Clinical interventions are not clearly documented. ';
    }

    // Missing connections feedback
    if (connections.missingConnections.length > 0) {
      feedback += `Consider strengthening connections between: ${connections.missingConnections.slice(0, 3).join(', ')}. `;
    }

    return feedback.trim();
  }

  public analyze(): any {
    const sectionCoverage = this.analyzeSectionCoverage();
    const actions = this.analyzePatientCareActions();
    const interventions = this.analyzeClinicalInterventions();
    const connections = this.analyzeGoldenThreadConnections();

    // Calculate overall compliance score
    const overallScore = Math.round(
      sectionCoverage.overallScore * 0.3 +
      connections.connectionScore * 0.4 +
      (actions.totalActions > 0 && interventions.totalInterventions > 0 ? 30 : 0)
    );

    const compliant = overallScore >= 70;
    const feedback = this.generateProfessionalFeedback(sectionCoverage, actions, interventions, connections);

    return {
      golden_thread_compliance: compliant ? "Compliant" : "Non-compliant",
      compliance_score: overallScore,
      feedback,
      actions_found: Object.values(actions.actions).flatMap(a => a.found),
      interventions_found: Object.values(interventions.interventions).flatMap(i => i.found),
      sections_covered: Object.keys(sectionCoverage.coverage).filter(key => sectionCoverage.coverage[key].present),
      missing_connections: connections.missingConnections,
      section_coverage: Object.fromEntries(
        Object.entries(sectionCoverage.coverage).map(([key, value]) => [key, value.present])
      ),
      detailed_analysis: {
        section_coverage: sectionCoverage,
        patient_care_actions: actions,
        clinical_interventions: interventions,
        golden_thread_connections: connections
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

    const analyzer = new GoldenThreadAnalyzer(text);
    const result = analyzer.analyze();

    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Golden thread analysis error:', error);
    return NextResponse.json(
      { error: "Failed to analyze golden thread compliance" },
      { status: 500 }
    );
  }
}
