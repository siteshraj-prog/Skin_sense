export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Condition {
  name: string;
  confidence: number;
  description: string;
}

export interface SurveyAnswers {
  q1: string; // duration
  q2: string; // itchy
  q3: string; // spread
  q4: string; // fever
  q5: string; // location
  q6: string; // appearance
  q7: string; // allergies
  q8: string; // recentChanges
}

export interface ScanResult {
  id: string;
  timestamp: number;
  urgencyLevel: UrgencyLevel;
  top3Conditions: Condition[];
  surveyAnswers: SurveyAnswers;
  imageUrl?: string;
  imageQuality?: 'good' | 'blurry' | 'too_dark' | 'too_far' | 'unclear';
  confidenceScore: number;
  userFeedback?: 'matches' | 'partially' | 'wrong';
  correctCondition?: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  lastScanDate?: any; // Firestore Timestamp
}
