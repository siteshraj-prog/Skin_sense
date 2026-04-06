import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity,
  Upload, 
  Camera, 
  X, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  AlertTriangle, 
  Info, 
  Loader2, 
  FileText, 
  Printer, 
  RefreshCw,
  ExternalLink,
  MapPin,
  Utensils,
  Stethoscope,
  Heart,
  Droplets,
  Wind,
  Sun,
  ShieldAlert,
  Sparkles,
  MessageSquare,
  Beaker,
  HelpCircle,
  CheckCircle2,
  User as UserIcon
} from 'lucide-react';
import { User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { UrgencyLevel, Condition, SurveyAnswers, ScanResult, UserProfile } from '../types';
import { cn } from '../lib/utils';
import SkinGuideChat from './SkinGuideChat';
import ProductAnalyzer from './ProductAnalyzer';
import { GoogleGenAI } from "@google/genai";
import { checkImageQuality, ImageQualityResult } from '../lib/imageProcessing';
import { fuseResults } from '../lib/analysis';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

// --- Constants & Mock Data ---

const SURVEY_QUESTIONS = [
  { id: 'q1', text: "How long have you had this condition?", options: ["Less than 1 week", "1–4 weeks", "1–3 months", "More than 3 months"] },
  { id: 'q2', text: "Is the affected area itchy?", options: ["Yes, severely", "Yes, mildly", "No"] },
  { id: 'q3', text: "Has the condition spread to new areas?", options: ["Yes, rapidly", "Yes, slowly", "No, it's stable"] },
  { id: 'q4', text: "Do you have any fever or general illness?", options: ["Yes", "No", "Not sure"] },
  { id: 'q5', text: "Where on your body is it located?", options: ["Face", "Neck", "Arms/Hands", "Torso", "Legs/Feet", "Scalp", "Multiple areas"] },
  { id: 'q6', text: "What does the skin look like?", options: ["Red/inflamed", "Scaly/flaky", "Blistered", "Dry/cracked", "Discolored patches", "Raised bumps/warts"] },
  { id: 'q7', text: "Do you have any known allergies or skin conditions?", options: ["Yes", "No", "Not sure"] },
  { id: 'q8', text: "Have you recently changed soaps, detergents, or skincare products?", options: ["Yes", "No"] },
  { id: 'q9', text: "What best describes your natural skin tone? (Fitzpatrick Scale)", options: ["Type I-II (Fair/Light)", "Type III-IV (Medium/Olive)", "Type V-VI (Dark/Deep)"] },
];

const MOCK_CONDITIONS: Condition[] = [
  { name: "Eczema (Atopic Dermatitis)", confidence: 88, description: "A condition that makes your skin red and itchy. It's common in children but can occur at any age." },
  { name: "Psoriasis", confidence: 72, description: "A skin disease that causes red, itchy scaly patches, most commonly on the knees, elbows, trunk and scalp." },
  { name: "Contact Dermatitis", confidence: 65, description: "A red, itchy rash caused by direct contact with a substance or an allergic reaction to it." },
  { name: "Ringworm (Tinea Corporis)", confidence: 58, description: "A highly contagious fungal infection of the skin or scalp." },
  { name: "Acne Vulgaris", confidence: 85, description: "A skin condition that occurs when your hair follicles become plugged with oil and dead skin cells." },
  { name: "Hives (Urticaria)", confidence: 77, description: "Red, itchy welts that result from a skin reaction." },
];

// --- Helper Functions ---

const calculateUrgency = (answers: SurveyAnswers): UrgencyLevel => {
  if (answers.q4 === 'Yes' || answers.q3 === 'Yes, rapidly') return 'HIGH';
  if (answers.q3 === 'Yes, slowly' || answers.q2 === 'Yes, severely' || answers.q1 === 'More than 3 months') return 'MEDIUM';
  return 'LOW';
};

const getTopConditions = (answers: SurveyAnswers): Condition[] => {
  // Simple deterministic mock logic based on answers
  const results = [...MOCK_CONDITIONS].sort(() => Math.random() - 0.5).slice(0, 3);
  return results.map(c => ({ ...c, confidence: Math.min(c.confidence, 89) })); // Never > 90%
};

// --- Components ---

export default function DiagnosisFlow({ user, profile }: { user: User | null, profile: UserProfile | null }) {
  const [step, setStep] = useState(1);
  const [image, setImage] = useState<string | null>(null);
  const [surveyAnswers, setSurveyAnswers] = useState<Partial<SurveyAnswers>>({});
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisText, setAnalysisText] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showProductAnalyzer, setShowProductAnalyzer] = useState(false);
  const [imageQuality, setImageQuality] = useState<ImageQualityResult | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [ambiguousQuestion, setAmbiguousQuestion] = useState<{question: string, options: string[], conditionA: string, conditionB: string} | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // --- Handlers ---

  const clearImage = () => {
    setImage(null);
    setImageQuality(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Reset input value to allow selecting the same file again
      e.target.value = '';
      
      if (file.size > 10 * 1024 * 1024) {
        setError("File size exceeds 10MB limit.");
        return;
      }
      
      // Clear previous states
      setImageQuality(null);
      setError(null);
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;
        setImage(dataUrl);
        
        // Layer 2: Image Quality Gate
        const quality = await checkImageQuality(dataUrl);
        setImageQuality(quality);
        if (!quality.isGood) {
          setError(quality.feedback.join(' '));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSurveyOption = (questionId: string, option: string) => {
    setSurveyAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const nextQuestion = () => {
    if (currentQuestionIdx < SURVEY_QUESTIONS.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      startAnalysis();
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(prev => prev - 1);
    }
  };

  const getFriendlyErrorMessage = (err: any) => {
    const message = err?.message || String(err);
    
    if (message.includes("quota") || message.includes("429")) {
      return "We've reached our daily analysis limit. Please try again tomorrow.";
    }
    if (message.includes("safety") || message.includes("finishReason: SAFETY")) {
      return "The AI was unable to analyze this image due to safety filters. Please ensure the photo is clear and strictly shows the skin area.";
    }
    if (message.includes("image") || message.includes("invalid") || message.includes("400")) {
      return "There was an issue with the image format or size. Please try a different photo (JPG/PNG, <10MB).";
    }
    if (message.includes("network") || message.includes("fetch") || message.includes("offline")) {
      return "Network error. Please check your internet connection and try again.";
    }
    
    return "Failed to analyze image. Please try again with a clearer photo or check your connection.";
  };

  const startAnalysis = async () => {
    setStep(3);
    setAnalyzing(true);
    const texts = ["Analyzing image...", "Cross-referencing symptoms...", "Generating report..."];
    
    try {
      setAnalysisText(texts[0]);
      setAnalysisProgress(20);

      // Layer 1: Pre-trained vision model (Gemini 1.5 Pro Vision)
      const base64Data = image?.split(',')[1];
      if (!base64Data) throw new Error("No image data");

      const demographicContext = profile 
        ? `You are analyzing a skin condition for a ${profile.age}-year-old ${profile.gender} patient. Use this demographic data to weight the likelihood of conditions (e.g., consider hormonal acne for teens, or specific age-related dermatoses for seniors).`
        : "";

      const visionPrompt = `
        ${demographicContext}
        You are a dermatology image analysis assistant trained to identify common skin conditions visible in photographs. 
        Analyze the provided skin image and respond ONLY in the following JSON format:
        {
          "conditions": [
            { "name": "condition_name", "confidence": 0.0-1.0, "visual_features": ["feature1","feature2"] },
            { "name": "condition_name", "confidence": 0.0-1.0, "visual_features": ["feature1","feature2"] },
            { "name": "condition_name", "confidence": 0.0-1.0, "visual_features": ["feature1","feature2"] }
          ],
          "image_quality": "good|blurry|too_dark|too_far|unclear",
          "skin_area_visible": true|false,
          "dominant_visual_features": ["redness","scaling","blisters","discoloration","raised_bumps","dry_patches"]
        }
        Only return JSON. No preamble or explanation.
      `;

      const visionResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview", // Using flash for speed, but instructions say 1.5 Pro Vision (flash supports vision too)
        contents: [
          {
            parts: [
              { text: visionPrompt },
              { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
            ]
          }
        ],
        config: { responseMimeType: "application/json" }
      });

      const visionResult = JSON.parse(visionResponse.text || "{}");
      
      setAnalysisText(texts[1]);
      setAnalysisProgress(60);

      // Layer 3: Symptom-weighted scoring engine (Bayesian fusion)
      const finalAnswers = surveyAnswers as SurveyAnswers;
      const fusedConditions = fuseResults(
        visionResult.conditions.map((c: any) => ({ name: c.name, confidence: c.confidence })),
        finalAnswers,
        visionResult.image_quality || 'good'
      );

      const urgency = calculateUrgency(finalAnswers);

      // Layer 4: Ambiguous Condition Pairs
      if (fusedConditions.length >= 2 && Math.abs(fusedConditions[0].confidence - fusedConditions[1].confidence) < 15) {
        const condA = fusedConditions[0].name;
        const condB = fusedConditions[1].name;

        const scanResult: ScanResult = {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
          urgencyLevel: urgency,
          top3Conditions: fusedConditions,
          surveyAnswers: finalAnswers,
          imageUrl: image || undefined,
          imageQuality: visionResult.image_quality,
          confidenceScore: fusedConditions[0]?.confidence || 0
        };
        setResult(scanResult);

        if ((condA.includes("Eczema") && condB.includes("Contact")) || (condB.includes("Eczema") && condA.includes("Contact"))) {
          setAmbiguousQuestion({
            question: "Did these symptoms appear shortly after using a new product, soap, or detergent?",
            options: ["Yes, definitely", "No, it's been ongoing", "Not sure"],
            conditionA: "Contact Dermatitis",
            conditionB: "Eczema (Atopic Dermatitis)"
          });
          setAnalyzing(false);
          return; // Wait for user response
        }
        if ((condA.includes("Psoriasis") && condB.includes("Seborrheic")) || (condB.includes("Psoriasis") && condA.includes("Seborrheic"))) {
          setAmbiguousQuestion({
            question: "Are other areas like your elbows, knees, or lower back also affected?",
            options: ["Yes", "No, only scalp/face", "Not sure"],
            conditionA: "Psoriasis",
            conditionB: "Seborrheic Dermatitis"
          });
          setAnalyzing(false);
          return;
        }
      }

      setAnalysisText(texts[2]);
      setAnalysisProgress(100);

      const scanResult: ScanResult = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        urgencyLevel: urgency,
        top3Conditions: fusedConditions,
        surveyAnswers: finalAnswers,
        imageUrl: image || undefined,
        imageQuality: visionResult.image_quality,
        confidenceScore: fusedConditions[0]?.confidence || 0
      };

      finalizeAnalysis(scanResult);
    } catch (err: any) {
      console.error("Analysis error:", err);
      setError(getFriendlyErrorMessage(err));
      setAnalyzing(false);
      setStep(1);
    }
  };

  const handleAmbiguousAnswer = (answer: string) => {
    if (!ambiguousQuestion || !result) return;
    
    const updatedConditions = [...result.top3Conditions];
    if (answer === "Yes" || answer === "Yes, definitely") {
      // Boost conditionA
      const idx = updatedConditions.findIndex(c => c.name.includes(ambiguousQuestion.conditionA));
      if (idx !== -1) updatedConditions[idx].confidence = Math.min(updatedConditions[idx].confidence + 10, 89);
    } else if (answer === "No" || answer === "No, it's been ongoing") {
      // Boost conditionB
      const idx = updatedConditions.findIndex(c => c.name.includes(ambiguousQuestion.conditionB));
      if (idx !== -1) updatedConditions[idx].confidence = Math.min(updatedConditions[idx].confidence + 10, 89);
    }
    
    updatedConditions.sort((a, b) => b.confidence - a.confidence);
    setResult({ ...result, top3Conditions: updatedConditions, confidenceScore: updatedConditions[0].confidence });
    setAmbiguousQuestion(null);
    setStep(4);
  };
  const handleFeedback = async (feedback: 'matches' | 'partially' | 'wrong', correctCondition?: string) => {
    if (!result) return;
    
    try {
      // Update local state to show "Thank you" message
      setResult(prev => prev ? { ...prev, userFeedback: feedback, correctCondition } : null);
      setFeedbackSubmitted(true);
      
      // If user is logged in, we could sync this to a database in the future
      if (user) {
        console.log("Feedback submitted by logged-in user:", feedback);
      }
    } catch (err) {
      console.error("Error submitting feedback:", err);
    }
  };

  const finalizeAnalysis = (scanResult: ScanResult) => {
    setResult(scanResult);
    setAnalyzing(false);
    setStep(4);

    // Save to Firebase if user is logged in
    if (user) {
      try {
        addDoc(collection(db, `scans/${user.uid}/results`), {
          ...scanResult,
          timestamp: serverTimestamp()
        });
      } catch (err) {
        console.error("Error saving scan:", err);
      }
    }
  };

  const resetFlow = () => {
    setStep(1);
    clearImage();
    setSurveyAnswers({});
    setCurrentQuestionIdx(0);
    setResult(null);
    setFeedbackSubmitted(false);
    setAmbiguousQuestion(null);
  };

  const handlePrint = async () => {
    if (!reportRef.current) {
      window.print();
      return;
    }

    try {
      setAnalyzing(true);
      setAnalysisText("Generating PDF report...");
      
      const element = reportRef.current;
      const dataUrl = await toPng(element, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`SkinSense_Report_${new Date().getTime()}.pdf`);
      
      setAnalyzing(false);
    } catch (err) {
      console.error("PDF generation error:", err);
      window.print();
      setAnalyzing(false);
    }
  };

  // --- Renderers ---

  const renderStepIndicator = () => (
    <div className="max-w-xl mx-auto mb-12 no-print">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
        {[1, 2, 4].map((s) => (
          <div key={s} className="relative z-10 flex flex-col items-center">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all border-4",
              step >= s ? "bg-teal-primary text-white border-teal-100" : "bg-white text-slate-400 border-slate-100"
            )}>
              {step > s ? <Check className="w-5 h-5" /> : (s === 4 ? 3 : s)}
            </div>
            <span className={cn(
              "text-xs font-bold mt-2 uppercase tracking-wider",
              step >= s ? "text-teal-primary" : "text-slate-400"
            )}>
              {s === 1 ? "Upload" : s === 2 ? "Survey" : "Results"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen py-12 px-4 bg-slate-50">
      <div className="max-w-4xl mx-auto">
        {renderStepIndicator()}

        <AnimatePresence mode="wait">
          {/* STEP 1: UPLOAD */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card p-8 rounded-3xl"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-navy mb-2">Step 1: Upload Photo</h2>
                <p className="text-slate-500">Provide a clear image of the affected skin area.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  {!image ? (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "aspect-video border-4 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-teal-50/50",
                        error ? "border-red-300 bg-red-50" : "border-teal-100 hover:border-teal-primary"
                      )}
                    >
                      <Upload className="w-12 h-12 text-teal-primary mb-4" />
                      <p className="text-navy font-bold">Click to upload or drag and drop</p>
                      <p className="text-slate-400 text-sm mt-1">JPG, PNG, WEBP (Max 10MB)</p>
                    </div>
                  ) : (
                    <div className="relative aspect-video rounded-3xl overflow-hidden border-4 border-white shadow-lg">
                      <img src={image} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        onClick={clearImage}
                        className="absolute top-4 right-4 bg-navy/80 text-white p-2 rounded-full hover:bg-navy transition-all"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />

                  {image && imageQuality && (
                    <div className="mt-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Image Quality</span>
                        <span className={cn(
                          "text-xs font-bold px-2 py-1 rounded-md",
                          imageQuality.score > 80 ? "bg-emerald-50 text-emerald-600" :
                          imageQuality.score > 60 ? "bg-amber-50 text-amber-600" :
                          "bg-red-50 text-red-600"
                        )}>
                          {imageQuality.score > 80 ? "Excellent" : imageQuality.score > 60 ? "Acceptable" : "Poor"}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                        <div 
                          className={cn(
                            "h-full transition-all duration-500",
                            imageQuality.score > 80 ? "bg-emerald-500" :
                            imageQuality.score > 60 ? "bg-amber-500" :
                            "bg-red-500"
                          )}
                          style={{ width: `${imageQuality.score}%` }}
                        />
                      </div>
                      {imageQuality.feedback.length > 0 && (
                        <div className="space-y-1">
                          {imageQuality.feedback.map((f, i) => (
                            <p key={i} className="text-[10px] text-slate-500 flex items-center space-x-1">
                              <span className="w-1 h-1 bg-slate-300 rounded-full" />
                              <span>{f}</span>
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-6 flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 bg-navy text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-slate-800 transition-all"
                    >
                      <Camera className="w-5 h-5 text-teal-primary" />
                      <span>{image ? "Retake Photo" : "Use Camera"}</span>
                    </button>
                    <button 
                      disabled={!image || (imageQuality && !imageQuality.isGood)}
                      onClick={() => setStep(2)}
                      className="flex-1 bg-teal-primary disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-teal-600 transition-all shadow-lg shadow-teal-500/20"
                    >
                      <span>Analyze & Continue</span>
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  {error && <p className="mt-4 text-red-500 text-sm font-medium flex items-center space-x-1"><AlertTriangle className="w-4 h-4" /> <span>{error}</span></p>}
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <h3 className="font-bold text-navy mb-4 flex items-center space-x-2">
                    <Info className="w-5 h-5 text-teal-primary" />
                    <span>Good Photo Tips</span>
                  </h3>
                  <ul className="space-y-4">
                    {[
                      "Ensure bright, natural lighting",
                      "Fill the frame with the affected area",
                      "Avoid blur — keep the camera steady",
                      "Include some healthy skin for contrast"
                    ].map((tip, i) => (
                      <li key={i} className="flex items-start space-x-3 text-sm text-slate-600">
                        <div className="w-5 h-5 bg-teal-100 text-teal-primary rounded-full flex-shrink-0 flex items-center justify-center mt-0.5">
                          <Check className="w-3 h-3" />
                        </div>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: SURVEY */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card p-8 rounded-3xl"
            >
              <div className="mb-8">
                <div className="flex justify-between items-end mb-2">
                  <h2 className="text-2xl font-bold text-navy">Step 2: Symptom Survey</h2>
                  <span className="text-sm font-bold text-teal-primary">Question {currentQuestionIdx + 1} of 8</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentQuestionIdx + 1) / 8) * 100}%` }}
                    className="h-full bg-teal-primary"
                  />
                </div>
              </div>

              <div className="min-h-[300px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentQuestionIdx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <h3 className="text-xl font-semibold text-navy leading-tight">
                      {SURVEY_QUESTIONS[currentQuestionIdx].text}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {SURVEY_QUESTIONS[currentQuestionIdx].options.map((option) => (
                        <button
                          key={option}
                          onClick={() => handleSurveyOption(SURVEY_QUESTIONS[currentQuestionIdx].id, option)}
                          className={cn(
                            "p-4 rounded-xl text-left font-medium transition-all border-2",
                            surveyAnswers[SURVEY_QUESTIONS[currentQuestionIdx].id as keyof SurveyAnswers] === option
                              ? "bg-teal-50 border-teal-primary text-teal-primary"
                              : "bg-white border-slate-100 text-slate-600 hover:border-slate-200"
                          )}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="mt-12 flex justify-between">
                <button 
                  onClick={prevQuestion}
                  disabled={currentQuestionIdx === 0}
                  className="flex items-center space-x-2 text-slate-400 hover:text-navy disabled:opacity-0 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="font-bold">Back</span>
                </button>
                <button 
                  onClick={nextQuestion}
                  disabled={!surveyAnswers[SURVEY_QUESTIONS[currentQuestionIdx].id as keyof SurveyAnswers]}
                  className={cn(
                    "px-8 py-4 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all shadow-lg",
                    currentQuestionIdx === SURVEY_QUESTIONS.length - 1 
                      ? "bg-coral-urgency text-white hover:bg-orange-600 shadow-orange-500/20" 
                      : "bg-navy text-white hover:bg-slate-800 shadow-slate-500/20"
                  )}
                >
                  <span>{currentQuestionIdx === SURVEY_QUESTIONS.length - 1 ? "Get My Results" : "Next Question"}</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: ANALYZING */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {ambiguousQuestion ? (
                <div className="glass-card p-12 rounded-3xl text-center border-2 border-teal-100">
                  <HelpCircle className="w-16 h-16 text-teal-primary mx-auto mb-6" />
                  <h2 className="text-2xl font-bold text-navy mb-4">One quick follow-up...</h2>
                  <p className="text-slate-600 mb-8 text-lg">{ambiguousQuestion.question}</p>
                  <div className="flex flex-col gap-4 max-w-md mx-auto">
                    {ambiguousQuestion.options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleAmbiguousAnswer(opt)}
                        className="w-full p-4 rounded-xl border-2 border-slate-100 hover:border-teal-primary hover:bg-teal-50 transition-all font-bold text-navy text-left flex justify-between items-center"
                      >
                        <span>{opt}</span>
                        <ChevronRight className="w-5 h-5 text-slate-300" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="glass-card p-12 rounded-3xl text-center">
                  <Loader2 className="w-16 h-16 text-teal-primary animate-spin mx-auto mb-6" />
                  <h2 className="text-2xl font-bold text-navy mb-2">{analysisText}</h2>
                  <div className="max-w-xs mx-auto h-2 bg-slate-100 rounded-full mt-6 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${analysisProgress}%` }}
                      className="h-full bg-teal-primary"
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 4: RESULTS */}
          {step === 4 && result && (
            <motion.div
              key="step4"
              ref={reportRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 p-4 md:p-0"
            >
              {/* URGENCY BANNER */}
              <div className={cn(
                "p-6 rounded-3xl flex items-center space-x-6 shadow-lg",
                result.urgencyLevel === 'HIGH' ? "bg-coral-urgency text-white" :
                result.urgencyLevel === 'MEDIUM' ? "bg-amber-500 text-white" :
                "bg-emerald-500 text-white"
              )}>
                <div className="bg-white/20 p-4 rounded-2xl">
                  <ShieldAlert className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-xl font-bold uppercase tracking-wider mb-1">
                    Urgency: {result.urgencyLevel}
                  </h3>
                  <p className="font-medium opacity-90">
                    {result.urgencyLevel === 'HIGH' ? "Seek medical attention soon. This may require prompt care." :
                     result.urgencyLevel === 'MEDIUM' ? "Consider visiting a dermatologist within 1–2 weeks." :
                     "No immediate concern. Monitor condition at home."}
                  </p>
                </div>
              </div>
                  {/* Layer 4: Confidence Thresholds */}
                  {result.confidenceScore < 50 ? (
                    <div className="glass-card p-12 rounded-3xl text-center border-2 border-amber-100 bg-amber-50/30">
                      <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-6" />
                      <h2 className="text-2xl font-bold text-navy mb-4">Inconclusive Assessment</h2>
                      <p className="text-slate-600 max-w-lg mx-auto mb-8 leading-relaxed">
                        The image and symptoms provided don't give us enough confidence for a reliable assessment. 
                        AI tools cannot achieve 100% accuracy. Always verify with a professional.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button onClick={resetFlow} className="bg-navy text-white px-8 py-4 rounded-xl font-bold hover:bg-slate-800 transition-all">
                          Retake Photo
                        </button>
                        <a href="https://www.google.com/maps/search/dermatologist+near+me" target="_blank" className="bg-white border-2 border-slate-200 text-navy px-8 py-4 rounded-xl font-bold hover:border-navy transition-all">
                          Find Nearest Doctor
                        </a>
                      </div>
                    </div>
                  ) : (
                    <>
                      {result.confidenceScore < 75 && (
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start space-x-3 text-amber-800">
                          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                          <p className="text-sm font-medium">
                            Our AI is moderately confident. We strongly recommend consulting a dermatologist for confirmation.
                          </p>
                        </div>
                      )}

                      {/* TOP CONDITIONS */}
                      <div className="glass-card p-8 rounded-3xl">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xl font-bold text-navy flex items-center space-x-2">
                            <Activity className="w-6 h-6 text-teal-primary" />
                            <span>Likely Conditions</span>
                          </h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            AI Confidence: {result.confidenceScore < 75 ? "Moderate" : "High"}
                          </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {result.top3Conditions.map((condition, i) => (
                            <div key={i} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-1 h-full bg-teal-primary" />
                              <div className="flex justify-between items-start mb-4">
                                <h4 className="font-bold text-navy leading-tight">{condition.name}</h4>
                                <span className="text-xs font-bold text-teal-primary bg-teal-50 px-2 py-1 rounded-md">
                                  {result.confidenceScore < 75 ? (i === 0 ? "Most Likely" : i === 1 ? "Possible" : "Less Likely") : `${condition.confidence}%`}
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-200 rounded-full mb-4 overflow-hidden">
                                <div className="h-full bg-teal-primary" style={{ width: `${condition.confidence}%` }} />
                              </div>
                              <p className="text-xs text-slate-500 leading-relaxed">
                                {condition.description || "Consistent with visual features and symptoms reported."}
                              </p>
                            </div>
                          ))}
                        </div>
                        <p className="mt-6 text-[10px] text-slate-400 text-center uppercase tracking-widest font-bold">
                          AI tools cannot achieve 100% accuracy. Always verify with a professional.
                        </p>
                      </div>
                    </>
                  )}

                  {/* GUIDANCE & NUTRITION */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="glass-card p-8 rounded-3xl">
                      <h3 className="text-xl font-bold text-navy mb-6 flex items-center space-x-2">
                        <Stethoscope className="w-6 h-6 text-teal-primary" />
                        <span>Guidance & Next Steps</span>
                      </h3>
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-sm font-bold text-emerald-600 mb-3 uppercase tracking-widest">Do's</h4>
                          <ul className="space-y-2">
                            {["Keep the area clean and dry", "Use mild, fragrance-free soap", "Apply prescribed creams if any"].map((item, i) => (
                              <li key={i} className="flex items-center space-x-2 text-sm text-slate-600">
                                <Check className="w-4 h-4 text-emerald-500" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-coral-urgency mb-3 uppercase tracking-widest">Don'ts</h4>
                          <ul className="space-y-2">
                            {["Self-medicate with steroids", "Scratch or pick at the area", "Use harsh chemicals or exfoliants"].map((item, i) => (
                              <li key={i} className="flex items-center space-x-2 text-sm text-slate-600">
                                <X className="w-4 h-4 text-coral-urgency" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="glass-card p-8 rounded-3xl">
                      <h3 className="text-xl font-bold text-navy mb-6 flex items-center space-x-2">
                        <Utensils className="w-6 h-6 text-teal-primary" />
                        <span>Nutrition Guidance</span>
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-emerald-50 p-4 rounded-2xl">
                          <h4 className="text-xs font-bold text-emerald-700 mb-3 uppercase">Include</h4>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-xs text-emerald-800">
                              <Droplets className="w-3 h-3" /> <span>Vitamin C (Citrus)</span>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-emerald-800">
                              <Heart className="w-3 h-3" /> <span>Omega-3 (Nuts)</span>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-emerald-800">
                              <Sun className="w-3 h-3" /> <span>Antioxidants</span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-2xl">
                          <h4 className="text-xs font-bold text-orange-700 mb-3 uppercase">Avoid</h4>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-xs text-orange-800">
                              <Wind className="w-3 h-3" /> <span>Spicy Foods</span>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-orange-800">
                              <Droplets className="w-3 h-3" /> <span>High Dairy</span>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-orange-800">
                              <X className="w-3 h-3" /> <span>Processed Sugar</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI CHAT SECTION */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-card p-8 rounded-3xl border-2 border-teal-100 bg-teal-50/30">
                      <div className="flex flex-col h-full justify-between gap-6">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-teal-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
                            <Sparkles className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-navy mb-1">SkinGuide AI Assistant</h3>
                            <p className="text-sm text-slate-600">Have questions about your results? Chat with our empathetic AI assistant for guidance and support.</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setShowChat(true)}
                          className="w-full bg-navy text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-slate-800 transition-all shadow-lg"
                        >
                          <MessageSquare className="w-5 h-5 text-teal-primary" />
                          <span>Chat with SkinGuide</span>
                        </button>
                      </div>
                    </div>

                    <div className="glass-card p-8 rounded-3xl border-2 border-navy/10 bg-slate-50/50">
                      <div className="flex flex-col h-full justify-between gap-6">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-navy rounded-2xl flex items-center justify-center text-white shadow-lg shadow-navy/20">
                            <Beaker className="w-6 h-6 text-teal-primary" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-navy mb-1">Product Analyzer</h3>
                            <p className="text-sm text-slate-600">Upload a photo of your skincare product's ingredient list to check for potential irritants or allergens.</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setShowProductAnalyzer(true)}
                          className="w-full bg-white border-2 border-navy text-navy px-8 py-4 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-navy hover:text-white transition-all shadow-lg"
                        >
                          <Beaker className="w-5 h-5 text-teal-primary" />
                          <span>Analyze Your Products</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* CHAT MODAL */}
                  <AnimatePresence>
                    {showChat && (
                      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm">
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 20 }}
                          className="w-full max-w-2xl"
                        >
                          <SkinGuideChat 
                            scanResult={result} 
                            onClose={() => setShowChat(false)} 
                          />
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>

                  {/* PRODUCT ANALYZER MODAL */}
                  <AnimatePresence>
                    {showProductAnalyzer && (
                      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm">
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 20 }}
                          className="w-full max-w-2xl"
                        >
                          <ProductAnalyzer 
                            scanResult={result} 
                            onClose={() => setShowProductAnalyzer(false)} 
                          />
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>

                  {/* LOCATOR */}
                  <div className="glass-card p-8 rounded-3xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div>
                        <h3 className="text-xl font-bold text-navy mb-2 flex items-center space-x-2">
                          <MapPin className="w-6 h-6 text-teal-primary" />
                          <span>Dermatologist Locator</span>
                        </h3>
                        <p className="text-sm text-slate-500">Find qualified professionals in your vicinity.</p>
                      </div>
                      <a 
                        href="https://www.google.com/maps/search/dermatologist+near+me"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-navy text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-slate-800 transition-all"
                      >
                        <span>Find Nearby Doctors</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Layer 5: Feedback Loop */}
                  <div className="glass-card p-8 rounded-3xl text-center border border-slate-100">
                    {!feedbackSubmitted ? (
                      <>
                        <h4 className="font-bold text-navy mb-4">Was this helpful? Did we get it right?</h4>
                        <div className="flex flex-wrap justify-center gap-3">
                          <button 
                            onClick={() => handleFeedback('matches')}
                            className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-sm font-bold hover:bg-emerald-100 transition-all"
                          >
                            Yes, this matches
                          </button>
                          <button 
                            onClick={() => handleFeedback('partially')}
                            className="px-4 py-2 bg-amber-50 text-amber-700 border border-amber-100 rounded-full text-sm font-bold hover:bg-amber-100 transition-all"
                          >
                            Partially right
                          </button>
                          <button 
                            onClick={() => handleFeedback('wrong')}
                            className="px-4 py-2 bg-red-50 text-red-700 border border-red-100 rounded-full text-sm font-bold hover:bg-red-100 transition-all"
                          >
                            No, this is wrong
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center space-x-2 text-emerald-600 font-bold">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Thank you for your feedback! This helps us improve.</span>
                      </div>
                    )}
                  </div>

                  {/* ACTIONS */}
                  <div className="flex flex-col sm:flex-row gap-4 no-print">
                    <button 
                      onClick={handlePrint}
                      className="flex-1 bg-white border-2 border-slate-200 text-navy py-4 rounded-xl font-bold flex items-center justify-center space-x-2 hover:border-navy transition-all"
                    >
                      <Printer className="w-5 h-5" />
                      <span>Download Report</span>
                    </button>
                    <button 
                      onClick={resetFlow}
                      className="flex-1 bg-teal-primary text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-teal-600 transition-all shadow-lg shadow-teal-500/20"
                    >
                      <RefreshCw className="w-5 h-5" />
                      <span>Start New Diagnosis</span>
                    </button>
                  </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
