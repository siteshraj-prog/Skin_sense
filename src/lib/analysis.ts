import { SurveyAnswers, Condition, UrgencyLevel } from '../types';

export const symptomWeights: Record<string, Record<string, number>> = {
  "Eczema (Atopic Dermatitis)": {
    "itchy_severely": 0.3,
    "itchy_mildly": 0.15,
    "dry/cracked": 0.25,
    "More than 3 months": 0.2,
    "Yes, slowly": 0.15,
    "No": -0.1 // fever_no
  },
  "Psoriasis": {
    "scaly/flaky": 0.35,
    "More than 3 months": 0.3,
    "No": 0.15, // no_itching (q2)
    "Yes": 0.25 // allergies/history (q7)
  },
  "Ringworm (Tinea Corporis)": {
    "Yes, slowly": 0.3,
    "itchy_mildly": 0.2,
    "Red/inflamed": 0.2,
    "Multiple areas": 0.3
  },
  "Contact Dermatitis": {
    "Yes": 0.45, // recent_product_change (q8)
    "itchy_severely": 0.3,
    "Less than 1 week": 0.2,
    "Face": 0.25
  },
  "Acne Vulgaris": {
    "Face": 0.3,
    "Raised bumps/warts": 0.35,
    "Less than 1 week": -0.1,
    "No": 0.2 // fever_no
  },
  "Hives (Urticaria)": {
    "Less than 1 week": 0.4,
    "itchy_severely": 0.35,
    "Yes, rapidly": 0.3,
    "Yes": 0.3 // recent_product_change (q8)
  },
  "Vitiligo": {
    "Discolored patches": 0.5,
    "No": 0.2, // no_itch
    "More than 3 months": 0.25
  },
  "Seborrheic Dermatitis": {
    "Scalp": 0.4,
    "scaly/flaky": 0.3,
    "Face": 0.2
  }
};

export const prevalencePriors: Record<string, number> = {
  "Ringworm (Tinea Corporis)": 0.15,
  "Vitiligo": 0.12, // Pityriasis Versicolor often misdiagnosed as Vitiligo in priors
  "Eczema (Atopic Dermatitis)": 0.08,
  "Contact Dermatitis": 0.05,
  "Acne Vulgaris": 0.05,
  "Psoriasis": 0.03
};

export function fuseResults(
  imageConditions: { name: string; confidence: number }[],
  answers: SurveyAnswers,
  imageQuality: 'good' | 'blurry' | 'too_dark' | 'too_far' | 'unclear'
): Condition[] {
  const finalScores: Record<string, number> = {};

  // Initialize with image confidence
  imageConditions.forEach(c => {
    finalScores[c.name] = c.confidence;
  });

  // Apply symptom weights
  Object.keys(symptomWeights).forEach(conditionName => {
    let symptomScore = 0;
    const weights = symptomWeights[conditionName];

    // Map survey answers to weight keys
    const answerValues = Object.values(answers);
    answerValues.forEach(val => {
      // Check if the value (e.g. "itchy_severely") exists in weights
      // We need to normalize keys slightly
      const normalizedVal = val.toLowerCase().replace(/\s+/g, '_');
      if (weights[val]) symptomScore += weights[val];
      if (weights[normalizedVal]) symptomScore += weights[normalizedVal];
    });

    // Bayesian Fusion
    const visualWeight = imageQuality === 'good' ? 0.6 : 0.4;
    const clinicalWeight = 1 - visualWeight;

    const currentVisual = finalScores[conditionName] || 0;
    finalScores[conditionName] = (currentVisual * visualWeight) + (symptomScore * clinicalWeight);
    
    // Apply India-specific priors
    if (prevalencePriors[conditionName]) {
      finalScores[conditionName] += prevalencePriors[conditionName];
    }
  });

  // Exclusion Rules
  if (answers.q4 === 'Yes') {
    delete finalScores["Contact Dermatitis"];
    delete finalScores["Acne Vulgaris"];
  }
  if (answers.q5 === 'Scalp' && answers.q6 !== 'Scaly/flaky') {
    delete finalScores["Seborrheic Dermatitis"];
  }

  // Convert to array and sort
  const sorted = Object.entries(finalScores)
    .map(([name, score]) => ({
      name,
      confidence: Math.min(Math.round(score * 100), 89), // Cap at 89%
      description: "" // Will be filled by static data or AI
    }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);

  return sorted;
}
