import { NextRequest, NextResponse } from 'next/server';

// Clinical Integrity Analysis System
// Professional solution for evaluating documents against clinical guidelines and best practices

// Enhanced Clinical Guidelines Database
const clinicalGuidelines = {
  // SOAP Framework Components
  soap: {
    subjective: {
      keywords: [
        'patient reports', 'patient states', 'patient complains', 'patient describes', 'chief complaint', 'history', 'symptoms', 'pain', 'discomfort', 'concerns',
        'patient denies', 'patient admits', 'patient mentions', 'patient indicates', 'patient explains', 'patient describes', 'patient feels', 'patient experiences',
        'onset', 'duration', 'frequency', 'severity', 'aggravating factors', 'alleviating factors', 'associated symptoms', 'previous episodes', 'family history',
        'social history', 'occupational history', 'travel history', 'dietary history', 'medication history', 'allergy history', 'surgical history'
      ],
      required: ['chief complaint', 'history of present illness'],
      weight: 0.25
    },
    objective: {
      keywords: [
        'vital signs', 'blood pressure', 'temperature', 'heart rate', 'respiratory rate', 'examination', 'assessment', 'findings', 'observations', 'physical exam',
        'systolic', 'diastolic', 'pulse', 'oxygen saturation', 'weight', 'height', 'bmi', 'body mass index', 'general appearance', 'mental status',
        'cardiovascular exam', 'respiratory exam', 'abdominal exam', 'neurological exam', 'musculoskeletal exam', 'skin exam', 'head and neck exam',
        'lymph nodes', 'edema', 'cyanosis', 'pallor', 'jaundice', 'rash', 'lesions', 'wounds', 'drainage', 'swelling', 'tenderness', 'masses'
      ],
      required: ['vital signs', 'physical examination'],
      weight: 0.25
    },
    assessment: {
      keywords: [
        'diagnosis', 'differential diagnosis', 'impression', 'assessment', 'problem list', 'clinical impression', 'working diagnosis',
        'primary diagnosis', 'secondary diagnosis', 'comorbidities', 'complications', 'risk factors', 'severity assessment', 'acuity level',
        'clinical reasoning', 'diagnostic criteria', 'ruling out', 'ruling in', 'clinical correlation', 'pathophysiology', 'etiology',
        'prognosis', 'expected course', 'risk stratification', 'clinical decision making', 'diagnostic impression'
      ],
      required: ['diagnosis', 'assessment'],
      weight: 0.25
    },
    plan: {
      keywords: [
        'treatment plan', 'intervention', 'medication', 'follow-up', 'referral', 'discharge plan', 'care plan', 'recommendations',
        'pharmacological therapy', 'non-pharmacological therapy', 'lifestyle modifications', 'dietary changes', 'exercise recommendations',
        'physical therapy', 'occupational therapy', 'speech therapy', 'respiratory therapy', 'cardiac rehabilitation', 'pain management',
        'wound care', 'dressing changes', 'monitoring plan', 'surveillance', 'preventive measures', 'immunizations', 'screening tests',
        'consultation', 'specialist referral', 'emergency plan', 'discharge instructions', 'home care', 'nursing care', 'family education'
      ],
      required: ['treatment plan', 'follow-up'],
      weight: 0.25
    }
  },

  // Enhanced Clinical Documentation Standards
  documentation: {
    patient_identification: {
      keywords: [
        'patient name', 'date of birth', 'medical record number', 'patient id', 'demographics', 'mrn', 'medical record',
        'patient identifier', 'unique identifier', 'social security number', 'ssn', 'insurance number', 'policy number',
        'contact information', 'phone number', 'address', 'emergency contact', 'next of kin', 'guardian', 'power of attorney'
      ],
      required: ['patient identification'],
      weight: 0.15
    },
    date_time: {
      keywords: [
        'date', 'time', 'timestamp', 'encounter date', 'visit date', 'admission date', 'discharge date', 'procedure date',
        'assessment date', 'evaluation date', 'follow-up date', 'appointment date', 'scheduled date', 'actual date',
        'time of arrival', 'time of departure', 'duration of stay', 'length of stay', 'time of assessment', 'time of intervention'
      ],
      required: ['date and time'],
      weight: 0.10
    },
    provider_identification: {
      keywords: [
        'physician', 'nurse', 'provider', 'clinician', 'attending', 'resident', 'practitioner', 'doctor', 'nurse practitioner',
        'physician assistant', 'pa', 'np', 'rn', 'lpn', 'cna', 'medical assistant', 'specialist', 'consultant', 'attending physician',
        'resident physician', 'fellow', 'intern', 'medical student', 'nursing student', 'clinical instructor', 'supervisor'
      ],
      required: ['provider identification'],
      weight: 0.10
    },
    informed_consent: {
      keywords: [
        'consent', 'informed consent', 'agreement', 'permission', 'authorization', 'written consent', 'verbal consent',
        'implied consent', 'emergency consent', 'parental consent', 'guardian consent', 'power of attorney consent',
        'advance directive', 'living will', 'durable power of attorney', 'healthcare proxy', 'do not resuscitate', 'dnr',
        'do not intubate', 'dni', 'comfort care only', 'full code', 'partial code', 'treatment preferences'
      ],
      required: ['consent documentation'],
      weight: 0.05
    },
    legal_requirements: {
      keywords: [
        'legal guardian', 'court order', 'legal documentation', 'legal requirements', 'regulatory compliance',
        'accreditation standards', 'joint commission', 'state regulations', 'federal regulations', 'hipaa compliance',
        'privacy act', 'confidentiality', 'patient rights', 'patient responsibilities', 'advance directives',
        'end of life care', 'palliative care', 'hospice care', 'comfort measures only'
      ],
      required: ['legal documentation'],
      weight: 0.05
    }
  },

  // Enhanced Clinical Safety Standards
  safety: {
    allergies: {
      keywords: [
        'allergies', 'allergic', 'allergic reaction', 'drug allergy', 'food allergy', 'no known allergies', 'nka',
        'medication allergy', 'environmental allergy', 'seasonal allergy', 'latex allergy', 'penicillin allergy',
        'sulfa allergy', 'aspirin allergy', 'codeine allergy', 'morphine allergy', 'allergy history', 'allergy testing',
        'anaphylaxis', 'anaphylactic reaction', 'severe allergic reaction', 'allergy alert', 'allergy bracelet',
        'allergy documentation', 'allergy verification', 'allergy reconciliation', 'drug allergy testing'
      ],
      required: ['allergy assessment'],
      weight: 0.20
    },
    medications: {
      keywords: [
        'medications', 'current medications', 'medication list', 'prescriptions', 'drugs', 'pharmacotherapy',
        'home medications', 'discharge medications', 'new medications', 'discontinued medications', 'medication changes',
        'medication reconciliation', 'medication review', 'medication history', 'medication administration', 'medication errors',
        'adverse drug reactions', 'drug interactions', 'medication compliance', 'medication adherence', 'medication education',
        'medication counseling', 'medication monitoring', 'therapeutic drug monitoring', 'medication safety', 'high alert medications',
        'controlled substances', 'narcotics', 'opioids', 'benzodiazepines', 'anticoagulants', 'insulin', 'chemotherapy'
      ],
      required: ['medication review'],
      weight: 0.20
    },
    vital_signs: {
      keywords: [
        'blood pressure', 'temperature', 'heart rate', 'respiratory rate', 'oxygen saturation', 'pulse', 'bp', 'temp', 'hr', 'rr', 'o2',
        'systolic', 'diastolic', 'mean arterial pressure', 'map', 'pulse pressure', 'body temperature', 'fever', 'hypothermia',
        'tachycardia', 'bradycardia', 'tachypnea', 'bradypnea', 'hypoxemia', 'hyperoxemia', 'pulse oximetry', 'spo2',
        'weight', 'height', 'bmi', 'body mass index', 'body surface area', 'bsa', 'pain scale', 'pain score', 'visual analog scale',
        'numeric rating scale', 'wong-baker faces scale', 'flacc scale', 'critical vital signs', 'abnormal vital signs'
      ],
      required: ['vital signs'],
      weight: 0.20
    },
    risk_assessment: {
      keywords: [
        'risk', 'risk factors', 'risk assessment', 'fall risk', 'pressure ulcer risk', 'infection risk',
        'suicide risk', 'self-harm risk', 'violence risk', 'elopement risk', 'wandering risk', 'aspiration risk',
        'deep vein thrombosis risk', 'dvt risk', 'pulmonary embolism risk', 'pe risk', 'stroke risk', 'cardiac risk',
        'respiratory risk', 'renal risk', 'hepatic risk', 'neurological risk', 'psychiatric risk', 'social risk',
        'environmental risk', 'occupational risk', 'genetic risk', 'family risk', 'lifestyle risk', 'behavioral risk',
        'nutritional risk', 'dehydration risk', 'malnutrition risk', 'obesity risk', 'diabetes risk', 'hypertension risk'
      ],
      required: ['risk assessment'],
      weight: 0.15
    },
    emergency_contacts: {
      keywords: [
        'emergency contact', 'next of kin', 'family contact', 'emergency information', 'emergency phone number',
        'primary contact', 'secondary contact', 'guardian contact', 'power of attorney contact', 'healthcare proxy contact',
        'emergency notification', 'emergency plan', 'emergency procedures', 'emergency protocols', 'emergency response',
        'emergency services', 'emergency department', 'emergency room', 'emergency transport', 'emergency evacuation'
      ],
      required: ['emergency contact'],
      weight: 0.05
    },
    infection_control: {
      keywords: [
        'infection control', 'hand hygiene', 'hand washing', 'gloves', 'gown', 'mask', 'face shield', 'personal protective equipment',
        'ppe', 'isolation precautions', 'contact precautions', 'droplet precautions', 'airborne precautions', 'standard precautions',
        'universal precautions', 'sterile technique', 'aseptic technique', 'disinfection', 'sterilization', 'sanitization',
        'infection prevention', 'infection surveillance', 'nosocomial infection', 'hospital acquired infection', 'hai',
        'central line associated bloodstream infection', 'clabsi', 'catheter associated urinary tract infection', 'cauti',
        'surgical site infection', 'ssi', 'ventilator associated pneumonia', 'vap', 'multidrug resistant organisms', 'mdro'
      ],
      required: ['infection control'],
      weight: 0.10
    },
    patient_safety: {
      keywords: [
        'patient safety', 'safety measures', 'safety protocols', 'safety guidelines', 'safety standards', 'safety checklists',
        'time out', 'surgical safety checklist', 'medication safety', 'fall prevention', 'pressure ulcer prevention',
        'infection prevention', 'fire safety', 'electrical safety', 'radiation safety', 'chemical safety', 'biological safety',
        'environmental safety', 'equipment safety', 'device safety', 'alarm safety', 'monitoring safety', 'transport safety'
      ],
      required: ['patient safety'],
      weight: 0.10
    }
  },

  // Enhanced Quality Indicators
  quality: {
    evidence_based: {
      keywords: [
        'evidence-based', 'clinical guidelines', 'best practice', 'protocol', 'standard of care', 'recommendations',
        'evidence-based medicine', 'clinical evidence', 'research evidence', 'systematic review', 'meta-analysis',
        'randomized controlled trial', 'rct', 'clinical trial', 'observational study', 'cohort study', 'case-control study',
        'clinical practice guidelines', 'consensus guidelines', 'expert opinion', 'clinical expertise', 'patient values',
        'clinical decision support', 'clinical pathways', 'care protocols', 'treatment algorithms', 'diagnostic algorithms'
      ],
      required: ['evidence-based practice'],
      weight: 0.30
    },
    patient_centered: {
      keywords: [
        'patient-centered', 'patient preferences', 'shared decision making', 'patient goals', 'patient values',
        'patient satisfaction', 'patient experience', 'patient engagement', 'patient activation', 'patient education',
        'patient counseling', 'patient support', 'patient advocacy', 'patient rights', 'patient autonomy', 'patient dignity',
        'patient privacy', 'patient confidentiality', 'patient comfort', 'patient safety', 'patient outcomes', 'patient reported outcomes',
        'quality of life', 'functional status', 'symptom management', 'pain management', 'comfort care', 'palliative care'
      ],
      required: ['patient-centered care'],
      weight: 0.25
    },
    interdisciplinary: {
      keywords: [
        'interdisciplinary', 'team approach', 'collaboration', 'consultation', 'referral', 'multidisciplinary',
        'interprofessional', 'team-based care', 'care coordination', 'care management', 'case management', 'discharge planning',
        'transitional care', 'care transitions', 'handoff communication', 'handoff report', 'shift report', 'bedside report',
        'team rounds', 'multidisciplinary rounds', 'interdisciplinary rounds', 'care conference', 'family conference',
        'team meeting', 'staff meeting', 'morning report', 'grand rounds', 'morbidity and mortality conference', 'm&m'
      ],
      required: ['interdisciplinary approach'],
      weight: 0.20
    },
    continuity: {
      keywords: [
        'continuity of care', 'follow-up', 'discharge planning', 'transition', 'care coordination',
        'care transition', 'transitional care', 'discharge instructions', 'discharge summary', 'discharge planning',
        'home care', 'home health', 'skilled nursing facility', 'rehabilitation', 'outpatient follow-up', 'primary care follow-up',
        'specialist follow-up', 'telemedicine', 'telehealth', 'remote monitoring', 'remote care', 'virtual care',
        'care coordination', 'care management', 'case management', 'disease management', 'chronic care management',
        'preventive care', 'wellness care', 'health maintenance', 'health promotion', 'health education'
      ],
      required: ['continuity of care'],
      weight: 0.25
    },
    quality_improvement: {
      keywords: [
        'quality improvement', 'quality assurance', 'quality monitoring', 'quality metrics', 'quality indicators',
        'performance improvement', 'process improvement', 'outcome improvement', 'patient safety improvement',
        'error reduction', 'adverse event reduction', 'complication reduction', 'readmission reduction',
        'length of stay reduction', 'cost reduction', 'efficiency improvement', 'effectiveness improvement',
        'satisfaction improvement', 'experience improvement', 'outcome measurement', 'performance measurement'
      ],
      required: ['quality improvement'],
      weight: 0.20
    }
  }
};

// Enhanced Medical Entity Recognition
const medicalEntities = {
  conditions: [
    // Cardiovascular
    'diabetes', 'hypertension', 'heart disease', 'coronary artery disease', 'cad', 'myocardial infarction', 'mi', 'heart attack',
    'congestive heart failure', 'chf', 'atrial fibrillation', 'afib', 'arrhythmia', 'cardiomyopathy', 'valvular heart disease',
    'peripheral artery disease', 'pad', 'deep vein thrombosis', 'dvt', 'pulmonary embolism', 'pe', 'stroke', 'cerebrovascular accident', 'cva',
    
    // Respiratory
    'asthma', 'copd', 'chronic obstructive pulmonary disease', 'pneumonia', 'bronchitis', 'emphysema', 'pulmonary fibrosis',
    'sleep apnea', 'pulmonary hypertension', 'pleural effusion', 'pneumothorax', 'tuberculosis', 'tb', 'cystic fibrosis',
    
    // Endocrine
    'diabetes mellitus', 'type 1 diabetes', 'type 2 diabetes', 'gestational diabetes', 'diabetic ketoacidosis', 'dka',
    'hypoglycemia', 'hyperglycemia', 'thyroid disorder', 'hypothyroidism', 'hyperthyroidism', 'thyroid cancer',
    'adrenal insufficiency', 'cushing syndrome', 'addison disease', 'pheochromocytoma',
    
    // Gastrointestinal
    'gastritis', 'peptic ulcer disease', 'gastroesophageal reflux disease', 'gerd', 'inflammatory bowel disease', 'ibd',
    'crohn disease', 'ulcerative colitis', 'celiac disease', 'liver disease', 'hepatitis', 'cirrhosis', 'pancreatitis',
    'gallbladder disease', 'cholecystitis', 'cholelithiasis', 'appendicitis', 'diverticulitis', 'colorectal cancer',
    
    // Renal/Genitourinary
    'kidney disease', 'chronic kidney disease', 'ckd', 'acute kidney injury', 'aki', 'nephritis', 'nephrotic syndrome',
    'kidney stones', 'urinary tract infection', 'uti', 'prostate cancer', 'benign prostatic hyperplasia', 'bph',
    'bladder cancer', 'renal cell carcinoma', 'polycystic kidney disease',
    
    // Neurological
    'alzheimer disease', 'dementia', 'parkinson disease', 'multiple sclerosis', 'ms', 'epilepsy', 'seizure disorder',
    'migraine', 'cluster headache', 'tension headache', 'brain tumor', 'meningitis', 'encephalitis', 'guillain-barre syndrome',
    'amyotrophic lateral sclerosis', 'als', 'huntington disease', 'tourette syndrome',
    
    // Psychiatric
    'depression', 'major depressive disorder', 'bipolar disorder', 'anxiety', 'generalized anxiety disorder', 'gad',
    'panic disorder', 'obsessive-compulsive disorder', 'ocd', 'post-traumatic stress disorder', 'ptsd', 'schizophrenia',
    'attention deficit hyperactivity disorder', 'adhd', 'autism spectrum disorder', 'asd', 'eating disorders',
    
    // Musculoskeletal
    'arthritis', 'osteoarthritis', 'rheumatoid arthritis', 'ra', 'gout', 'fibromyalgia', 'osteoporosis', 'osteopenia',
    'back pain', 'neck pain', 'joint pain', 'muscle pain', 'tendonitis', 'bursitis', 'carpal tunnel syndrome',
    'herniated disc', 'spinal stenosis', 'scoliosis', 'kyphosis',
    
    // Dermatological
    'psoriasis', 'eczema', 'atopic dermatitis', 'contact dermatitis', 'acne', 'rosacea', 'vitiligo', 'melanoma',
    'basal cell carcinoma', 'squamous cell carcinoma', 'herpes', 'shingles', 'varicella zoster', 'fungal infection',
    
    // Hematological
    'anemia', 'iron deficiency anemia', 'vitamin b12 deficiency', 'folate deficiency', 'sickle cell anemia',
    'thalassemia', 'leukemia', 'lymphoma', 'multiple myeloma', 'hemophilia', 'von willebrand disease',
    
    // Infectious Diseases
    'hiv', 'aids', 'hepatitis a', 'hepatitis b', 'hepatitis c', 'influenza', 'covid-19', 'sars-cov-2', 'mononucleosis',
    'lyme disease', 'malaria', 'dengue fever', 'zika virus', 'ebola virus', 'meningococcal disease',
    
    // Other
    'obesity', 'metabolic syndrome', 'cancer', 'malignancy', 'tumor', 'neoplasm', 'benign', 'malignant', 'metastatic',
    'autoimmune disease', 'lupus', 'systemic lupus erythematosus', 'sle', 'scleroderma', 'sjogren syndrome'
  ],
  
  medications: [
    // Cardiovascular
    'aspirin', 'acetaminophen', 'ibuprofen', 'naproxen', 'diclofenac', 'celecoxib', 'lisinopril', 'enalapril', 'ramipril',
    'captopril', 'benazepril', 'quinapril', 'perindopril', 'trandolapril', 'moexipril', 'fosinopril', 'metoprolol',
    'atenolol', 'propranolol', 'carvedilol', 'bisoprolol', 'nebivolol', 'amlodipine', 'nifedipine', 'diltiazem',
    'verapamil', 'losartan', 'valsartan', 'candesartan', 'irbesartan', 'olmesartan', 'telmisartan', 'atorvastatin',
    'simvastatin', 'pravastatin', 'rosuvastatin', 'fluvastatin', 'lovastatin', 'pitavastatin', 'nitroglycerin',
    'isosorbide', 'hydralazine', 'minoxidil', 'clonidine', 'methyldopa', 'doxazosin', 'terazosin', 'prazosin',
    
    // Diabetes
    'metformin', 'glipizide', 'glyburide', 'glimepiride', 'pioglitazone', 'rosiglitazone', 'sitagliptin', 'saxagliptin',
    'linagliptin', 'alogliptin', 'empagliflozin', 'canagliflozin', 'dapagliflozin', 'insulin', 'insulin glargine',
    'insulin detemir', 'insulin aspart', 'insulin lispro', 'insulin regular', 'insulin nph',
    
    // Respiratory
    'albuterol', 'salmeterol', 'formoterol', 'vilanterol', 'ipratropium', 'tiotropium', 'umeclidinium', 'glycopyrrolate',
    'fluticasone', 'budesonide', 'mometasone', 'ciclesonide', 'beclomethasone', 'prednisone', 'methylprednisolone',
    'dexamethasone', 'montelukast', 'zafirlukast', 'theophylline', 'roflumilast',
    
    // Gastrointestinal
    'omeprazole', 'esomeprazole', 'lansoprazole', 'pantoprazole', 'rabeprazole', 'dexlansoprazole', 'ranitidine',
    'famotidine', 'cimetidine', 'nizatidine', 'sucralfate', 'misoprostol', 'bismuth', 'metronidazole', 'clarithromycin',
    'amoxicillin', 'tetracycline', 'levofloxacin', 'moxifloxacin',
    
    // Pain Management
    'morphine', 'oxycodone', 'hydrocodone', 'codeine', 'tramadol', 'fentanyl', 'methadone', 'buprenorphine',
    'naloxone', 'naltrexone', 'gabapentin', 'pregabalin', 'carbamazepine', 'phenytoin', 'topiramate', 'lamotrigine',
    'duloxetine', 'venlafaxine', 'amitriptyline', 'nortriptyline', 'imipramine', 'desipramine',
    
    // Psychiatric
    'sertraline', 'fluoxetine', 'paroxetine', 'citalopram', 'escitalopram', 'fluvoxamine', 'bupropion', 'mirtazapine',
    'trazodone', 'nefazodone', 'vilazodone', 'vortioxetine', 'lithium', 'valproic acid', 'lamotrigine', 'carbamazepine',
    'risperidone', 'olanzapine', 'quetiapine', 'aripiprazole', 'ziprasidone', 'paliperidone', 'clozapine',
    
    // Antibiotics
    'amoxicillin', 'penicillin', 'cephalexin', 'cefazolin', 'ceftriaxone', 'cefepime', 'azithromycin', 'clarithromycin',
    'erythromycin', 'doxycycline', 'minocycline', 'tetracycline', 'ciprofloxacin', 'levofloxacin', 'moxifloxacin',
    'gentamicin', 'tobramycin', 'amikacin', 'vancomycin', 'linezolid', 'daptomycin', 'clindamycin', 'metronidazole',
    
    // Anticoagulants
    'warfarin', 'heparin', 'enoxaparin', 'dalteparin', 'fondaparinux', 'apixaban', 'rivaroxaban', 'dabigatran',
    'edoxaban', 'aspirin', 'clopidogrel', 'prasugrel', 'ticagrelor', 'dipyridamole',
    
    // Other Common
    'furosemide', 'hydrochlorothiazide', 'chlorthalidone', 'indapamide', 'spironolactone', 'eplerenone', 'triamterene',
    'amiloride', 'acetazolamide', 'mannitol', 'digoxin', 'amiodarone', 'sotalol', 'propafenone', 'flecainide',
    'diltiazem', 'verapamil', 'adenosine', 'atropine', 'epinephrine', 'norepinephrine', 'dopamine', 'dobutamine',
    'vasopressin', 'phenylephrine', 'nitroprusside', 'nesiritide', 'milrinone', 'levosimendan'
  ],
  
  procedures: [
    // Surgical Procedures
    'surgery', 'surgical procedure', 'operation', 'laparotomy', 'laparoscopy', 'thoracotomy', 'thoracoscopy',
    'arthroscopy', 'endoscopy', 'colonoscopy', 'esophagogastroduodenoscopy', 'egd', 'sigmoidoscopy', 'bronchoscopy',
    'cystoscopy', 'hysteroscopy', 'cardiac catheterization', 'angioplasty', 'stent placement', 'coronary artery bypass graft', 'cabg',
    'valve replacement', 'valve repair', 'pacemaker insertion', 'implantable cardioverter defibrillator', 'icd',
    'cardiac ablation', 'cardioversion', 'defibrillation', 'thoracentesis', 'paracentesis', 'lumbar puncture', 'spinal tap',
    
    // Diagnostic Procedures
    'biopsy', 'fine needle aspiration', 'fna', 'core needle biopsy', 'excisional biopsy', 'incisional biopsy',
    'punch biopsy', 'shave biopsy', 'endoscopic biopsy', 'bone marrow biopsy', 'liver biopsy', 'kidney biopsy',
    'lung biopsy', 'breast biopsy', 'prostate biopsy', 'skin biopsy', 'muscle biopsy', 'nerve biopsy',
    
    // Imaging
    'x-ray', 'radiograph', 'chest x-ray', 'abdominal x-ray', 'bone x-ray', 'computed tomography', 'ct scan',
    'magnetic resonance imaging', 'mri', 'ultrasound', 'sonography', 'echocardiogram', 'transesophageal echocardiogram', 'tee',
    'stress echocardiogram', 'nuclear medicine scan', 'positron emission tomography', 'pet scan', 'bone scan',
    'gallium scan', 'thallium scan', 'mammogram', 'mammography', 'breast ultrasound', 'breast mri',
    
    // Laboratory Tests
    'blood test', 'complete blood count', 'cbc', 'comprehensive metabolic panel', 'cmp', 'basic metabolic panel', 'bmp',
    'lipid panel', 'thyroid function test', 'tft', 'hemoglobin a1c', 'hba1c', 'glucose test', 'fasting glucose',
    'oral glucose tolerance test', 'ogtt', 'urinalysis', 'urine culture', 'stool culture', 'sputum culture',
    'blood culture', 'wound culture', 'throat culture', 'nasal swab', 'covid test', 'pcr test', 'antigen test',
    
    // Cardiovascular Tests
    'electrocardiogram', 'ekg', 'ecg', 'stress test', 'exercise stress test', 'dobutamine stress test',
    'nuclear stress test', 'holter monitor', 'event monitor', 'tilt table test', 'electrophysiology study', 'eps',
    'cardiac catheterization', 'coronary angiography', 'peripheral angiography', 'carotid ultrasound',
    'ankle-brachial index', 'abi', 'venous doppler', 'arterial doppler',
    
    // Respiratory Tests
    'pulmonary function test', 'pft', 'spirometry', 'bronchoprovocation test', 'methacholine challenge',
    'diffusion capacity', 'dlco', 'plethysmography', 'sleep study', 'polysomnography', 'cpap titration',
    'pulse oximetry', 'arterial blood gas', 'abg', 'peak flow measurement',
    
    // Other Procedures
    'lumbar puncture', 'spinal tap', 'epidural injection', 'facet injection', 'nerve block', 'trigger point injection',
    'joint injection', 'cortisone injection', 'steroid injection', 'botox injection', 'dermal filler injection',
    'chemotherapy', 'radiation therapy', 'immunotherapy', 'targeted therapy', 'hormone therapy', 'stem cell transplant',
    'bone marrow transplant', 'dialysis', 'hemodialysis', 'peritoneal dialysis', 'plasmapheresis', 'photopheresis'
  ],
  
  symptoms: [
    // Pain
    'pain', 'chest pain', 'abdominal pain', 'back pain', 'neck pain', 'headache', 'migraine', 'joint pain',
    'muscle pain', 'bone pain', 'nerve pain', 'neuropathic pain', 'phantom pain', 'referred pain', 'radiating pain',
    'sharp pain', 'dull pain', 'aching pain', 'throbbing pain', 'burning pain', 'stabbing pain', 'cramping pain',
    
    // Respiratory
    'shortness of breath', 'dyspnea', 'difficulty breathing', 'wheezing', 'cough', 'dry cough', 'productive cough',
    'coughing up blood', 'hemoptysis', 'chest tightness', 'chest pressure', 'rapid breathing', 'tachypnea',
    'slow breathing', 'bradypnea', 'shallow breathing', 'deep breathing', 'sighing', 'yawning',
    
    // Cardiovascular
    'palpitations', 'irregular heartbeat', 'fast heartbeat', 'tachycardia', 'slow heartbeat', 'bradycardia',
    'skipped beats', 'extra beats', 'heart racing', 'heart pounding', 'heart fluttering', 'chest discomfort',
    'chest heaviness', 'chest burning', 'chest squeezing', 'chest pressure', 'chest tightness',
    
    // Gastrointestinal
    'nausea', 'vomiting', 'dry heaves', 'retching', 'diarrhea', 'constipation', 'bloating', 'abdominal distension',
    'gas', 'flatulence', 'belching', 'burping', 'heartburn', 'acid reflux', 'indigestion', 'dyspepsia',
    'loss of appetite', 'anorexia', 'increased appetite', 'polyphagia', 'early satiety', 'feeling full quickly',
    'abdominal cramps', 'abdominal bloating', 'abdominal distension', 'abdominal tenderness', 'abdominal rigidity',
    
    // Neurological
    'dizziness', 'vertigo', 'lightheadedness', 'fainting', 'syncope', 'near syncope', 'confusion', 'disorientation',
    'memory loss', 'amnesia', 'seizure', 'convulsion', 'tremor', 'shaking', 'trembling', 'muscle weakness',
    'paralysis', 'numbness', 'tingling', 'paresthesia', 'burning sensation', 'pins and needles', 'loss of sensation',
    'difficulty walking', 'gait disturbance', 'balance problems', 'coordination problems', 'speech problems',
    'slurred speech', 'difficulty speaking', 'aphasia', 'vision problems', 'blurred vision', 'double vision',
    'loss of vision', 'blindness', 'hearing problems', 'ringing in ears', 'tinnitus', 'hearing loss', 'deafness',
    
    // Constitutional
    'fever', 'chills', 'sweating', 'night sweats', 'fatigue', 'tiredness', 'exhaustion', 'weakness', 'malaise',
    'lethargy', 'listlessness', 'lack of energy', 'decreased energy', 'increased energy', 'hyperactivity',
    'restlessness', 'agitation', 'irritability', 'mood changes', 'depression', 'anxiety', 'panic', 'fear',
    'anger', 'rage', 'euphoria', 'mania', 'hallucinations', 'delusions', 'paranoia', 'psychosis',
    
    // Skin
    'rash', 'itching', 'pruritus', 'hives', 'urticaria', 'swelling', 'edema', 'bruising', 'ecchymosis',
    'bleeding', 'hemorrhage', 'petechiae', 'purpura', 'ulcers', 'sores', 'wounds', 'cuts', 'scrapes',
    'burns', 'blisters', 'vesicles', 'pustules', 'nodules', 'masses', 'lumps', 'bumps', 'growths',
    'moles', 'nevi', 'freckles', 'age spots', 'liver spots', 'vitiligo', 'alopecia', 'hair loss',
    
    // Genitourinary
    'frequent urination', 'polyuria', 'decreased urination', 'oliguria', 'no urination', 'anuria', 'urgency',
    'incontinence', 'urinary incontinence', 'fecal incontinence', 'difficulty urinating', 'dysuria',
    'painful urination', 'burning with urination', 'blood in urine', 'hematuria', 'cloudy urine',
    'foul smelling urine', 'increased thirst', 'polydipsia', 'decreased thirst', 'adipsia',
    
    // Other
    'weight loss', 'unintentional weight loss', 'weight gain', 'unintentional weight gain', 'loss of appetite',
    'increased appetite', 'thirst', 'dry mouth', 'xerostomia', 'excessive thirst', 'polydipsia',
    'decreased thirst', 'adipsia', 'excessive hunger', 'polyphagia', 'decreased hunger', 'anorexia',
    'sleep problems', 'insomnia', 'difficulty falling asleep', 'difficulty staying asleep', 'early awakening',
    'excessive sleep', 'hypersomnia', 'daytime sleepiness', 'narcolepsy', 'sleep apnea', 'snoring'
  ]
};

// Advanced Text Analysis Functions
class ClinicalIntegrityAnalyzer {
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

  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\W+/).filter(w => w.length > 2));
    const words2 = new Set(text2.toLowerCase().split(/\W+/).filter(w => w.length > 2));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private extractMedicalEntities(): { [key: string]: string[] } {
    const entities: { [key: string]: string[] } = {};
    
    for (const [category, terms] of Object.entries(medicalEntities)) {
      entities[category] = terms.filter(term => 
        this.textLower.includes(term.toLowerCase())
      );
    }
    
    return entities;
  }

  private analyzeSOAPFramework(): { score: number; breakdown: any; missing: string[] } {
    const soapScores: any = {};
    const missing: string[] = [];
    let totalScore = 0;

    for (const [component, config] of Object.entries(clinicalGuidelines.soap)) {
      const foundKeywords = config.keywords.filter(keyword => 
        this.textLower.includes(keyword.toLowerCase())
      );
      
      const foundRequired = config.required.filter(required => 
        this.textLower.includes(required.toLowerCase())
      );
      
      const keywordScore = (foundKeywords.length / config.keywords.length) * 50;
      const requiredScore = (foundRequired.length / config.required.length) * 50;
      const componentScore = Math.round(keywordScore + requiredScore);
      
      soapScores[component] = {
        score: componentScore,
        keywords: foundKeywords,
        required: foundRequired,
        missing: config.required.filter(req => !this.textLower.includes(req.toLowerCase()))
      };
      
      totalScore += componentScore * config.weight;
      
      if (foundRequired.length < config.required.length) {
        missing.push(...config.required.filter(req => !this.textLower.includes(req.toLowerCase())));
      }
    }

    return {
      score: Math.round(totalScore),
      breakdown: soapScores,
      missing
    };
  }

  private analyzeDocumentationStandards(): { score: number; breakdown: any; missing: string[] } {
    const docScores: any = {};
    const missing: string[] = [];
    let totalScore = 0;

    for (const [standard, config] of Object.entries(clinicalGuidelines.documentation)) {
      const foundKeywords = config.keywords.filter(keyword => 
        this.textLower.includes(keyword.toLowerCase())
      );
      
      const foundRequired = config.required.filter(required => 
        this.textLower.includes(required.toLowerCase())
      );
      
      const keywordScore = (foundKeywords.length / config.keywords.length) * 60;
      const requiredScore = (foundRequired.length / config.required.length) * 40;
      const standardScore = Math.round(keywordScore + requiredScore);
      
      docScores[standard] = {
        score: standardScore,
        keywords: foundKeywords,
        required: foundRequired,
        missing: config.required.filter(req => !this.textLower.includes(req.toLowerCase()))
      };
      
      totalScore += standardScore * config.weight;
      
      if (foundRequired.length < config.required.length) {
        missing.push(...config.required.filter(req => !this.textLower.includes(req.toLowerCase())));
      }
    }

    return {
      score: Math.round(totalScore),
      breakdown: docScores,
      missing
    };
  }

  private analyzeSafetyStandards(): { score: number; breakdown: any; missing: string[] } {
    const safetyScores: any = {};
    const missing: string[] = [];
    let totalScore = 0;

    for (const [standard, config] of Object.entries(clinicalGuidelines.safety)) {
      const foundKeywords = config.keywords.filter(keyword => 
        this.textLower.includes(keyword.toLowerCase())
      );
      
      const foundRequired = config.required.filter(required => 
        this.textLower.includes(required.toLowerCase())
      );
      
      const keywordScore = (foundKeywords.length / config.keywords.length) * 70;
      const requiredScore = (foundRequired.length / config.required.length) * 30;
      const standardScore = Math.round(keywordScore + requiredScore);
      
      safetyScores[standard] = {
        score: standardScore,
        keywords: foundKeywords,
        required: foundRequired,
        missing: config.required.filter(req => !this.textLower.includes(req.toLowerCase()))
      };
      
      totalScore += standardScore * config.weight;
      
      if (foundRequired.length < config.required.length) {
        missing.push(...config.required.filter(req => !this.textLower.includes(req.toLowerCase())));
      }
    }

    return {
      score: Math.round(totalScore),
      breakdown: safetyScores,
      missing
    };
  }

  private analyzeQualityIndicators(): { score: number; breakdown: any; missing: string[] } {
    const qualityScores: any = {};
    const missing: string[] = [];
    let totalScore = 0;

    for (const [indicator, config] of Object.entries(clinicalGuidelines.quality)) {
      const foundKeywords = config.keywords.filter(keyword => 
        this.textLower.includes(keyword.toLowerCase())
      );
      
      const foundRequired = config.required.filter(required => 
        this.textLower.includes(required.toLowerCase())
      );
      
      const keywordScore = (foundKeywords.length / config.keywords.length) * 80;
      const requiredScore = (foundRequired.length / config.required.length) * 20;
      const indicatorScore = Math.round(keywordScore + requiredScore);
      
      qualityScores[indicator] = {
        score: indicatorScore,
        keywords: foundKeywords,
        required: foundRequired,
        missing: config.required.filter(req => !this.textLower.includes(req.toLowerCase()))
      };
      
      totalScore += indicatorScore * config.weight;
      
      if (foundRequired.length < config.required.length) {
        missing.push(...config.required.filter(req => !this.textLower.includes(req.toLowerCase())));
      }
    }

    return {
      score: Math.round(totalScore),
      breakdown: qualityScores,
      missing
    };
  }

  private analyzeClinicalComplexity(): { score: number; metrics: any } {
    const uniqueWords = new Set(this.words);
    const medicalTerms = Object.values(medicalEntities).flat();
    const foundMedicalTerms = medicalTerms.filter(term => 
      this.textLower.includes(term.toLowerCase())
    );
    
    const complexityMetrics = {
      sentenceCount: this.sentences.length,
      wordCount: this.words.length,
      uniqueWordCount: uniqueWords.size,
      averageSentenceLength: this.words.length / Math.max(this.sentences.length, 1),
      vocabularyDiversity: uniqueWords.size / Math.max(this.words.length, 1),
      medicalTermDensity: foundMedicalTerms.length / Math.max(this.words.length, 1),
      medicalTermCount: foundMedicalTerms.length
    };
    
    // Calculate complexity score based on medical terminology and document structure
    const complexityScore = Math.min(
      (complexityMetrics.medicalTermDensity * 200) + 
      (complexityMetrics.vocabularyDiversity * 100) + 
      (Math.min(complexityMetrics.sentenceCount / 10, 1) * 50),
      100
    );
    
    return {
      score: Math.round(complexityScore),
      metrics: complexityMetrics
    };
  }

  private generateRecommendations(soapScore: number, docScore: number, safetyScore: number, qualityScore: number): string[] {
    const recommendations: string[] = [];
    
    if (soapScore < 70) {
      recommendations.push("Enhance SOAP documentation structure with clear subjective, objective, assessment, and plan sections");
    }
    
    if (docScore < 70) {
      recommendations.push("Improve documentation standards by including patient identification, date/time stamps, and provider information");
    }
    
    if (safetyScore < 70) {
      recommendations.push("Strengthen safety documentation including allergies, medications, vital signs, and risk assessments");
    }
    
    if (qualityScore < 70) {
      recommendations.push("Incorporate evidence-based practices, patient-centered care, and interdisciplinary approaches");
    }
    
    if (recommendations.length === 0) {
      recommendations.push("Document demonstrates excellent clinical integrity and adherence to best practices");
    }
    
    return recommendations;
  }

  public analyze(): any {
    const soapAnalysis = this.analyzeSOAPFramework();
    const docAnalysis = this.analyzeDocumentationStandards();
    const safetyAnalysis = this.analyzeSafetyStandards();
    const qualityAnalysis = this.analyzeQualityIndicators();
    const complexityAnalysis = this.analyzeClinicalComplexity();
    const medicalEntities = this.extractMedicalEntities();
    
    // Calculate overall integrity score (weighted average)
    const overallScore = Math.round(
      soapAnalysis.score * 0.35 +
      docAnalysis.score * 0.20 +
      safetyAnalysis.score * 0.25 +
      qualityAnalysis.score * 0.20
    );
    
    // Generate comprehensive feedback
    let feedback = "";
    if (overallScore >= 90) {
      feedback = "Excellent clinical integrity. Document comprehensively meets clinical guidelines and best practices.";
    } else if (overallScore >= 75) {
      feedback = "Good clinical integrity with minor areas for improvement in documentation standards.";
    } else if (overallScore >= 60) {
      feedback = "Moderate clinical integrity. Several key areas need enhancement to meet clinical standards.";
    } else {
      feedback = "Significant gaps in clinical integrity. Major improvements needed to meet clinical guidelines.";
    }
    
    const recommendations = this.generateRecommendations(
      soapAnalysis.score,
      docAnalysis.score,
      safetyAnalysis.score,
      qualityAnalysis.score
    );
    
    return {
      integrity_score: overallScore,
      feedback,
      missing_elements: [...soapAnalysis.missing, ...docAnalysis.missing, ...safetyAnalysis.missing, ...qualityAnalysis.missing],
      entities: medicalEntities,
      key_phrases: this.extractKeyPhrases(),
      category_coverage: {
        soap: soapAnalysis.score,
        documentation: docAnalysis.score,
        safety: safetyAnalysis.score,
        quality: qualityAnalysis.score,
        complexity: complexityAnalysis.score
      },
      detailed_analysis: {
        soap: soapAnalysis,
        documentation: docAnalysis,
        safety: safetyAnalysis,
        quality: qualityAnalysis,
        complexity: complexityAnalysis
      },
      recommendations
    };
  }

  private extractKeyPhrases(): string[] {
    // Extract important clinical phrases based on medical terminology
    const phrases: string[] = [];
    const medicalTerms = Object.values(medicalEntities).flat();
    
    for (const term of medicalTerms) {
      if (this.textLower.includes(term.toLowerCase())) {
        // Find the sentence containing this term
        const sentence = this.sentences.find(s => 
          s.toLowerCase().includes(term.toLowerCase())
        );
        if (sentence) {
          phrases.push(sentence.trim());
        }
      }
    }
    
    return phrases.slice(0, 10); // Return top 10 phrases
  }
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing or invalid text" }, { status: 400 });
    }

    // Perform comprehensive clinical integrity analysis
    const analyzer = new ClinicalIntegrityAnalyzer(text);
    const result = analyzer.analyze();

    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Clinical integrity analysis error:', error);
    return NextResponse.json(
      { error: "Failed to analyze clinical integrity" },
      { status: 500 }
    );
  }
}
