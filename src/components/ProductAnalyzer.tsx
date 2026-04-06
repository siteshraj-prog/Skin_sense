import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Upload, 
  X, 
  Loader2, 
  Beaker, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  FileSearch,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { ScanResult } from '../types';
import { cn } from '../lib/utils';

interface ProductAnalyzerProps {
  scanResult: ScanResult;
  onClose?: () => void;
}

interface AnalysisResult {
  summary: string;
  redFlags: string[];
  chemistNote: string;
  extractedIngredients: string[];
}

export default function ProductAnalyzer({ scanResult, onClose }: ProductAnalyzerProps) {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const clearImage = () => {
    setImage(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Reset input value to allow selecting same file again
      e.target.value = '';
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const getFriendlyErrorMessage = (err: any) => {
    const message = err?.message || String(err);
    if (message.includes("quota") || message.includes("429")) {
      return "Daily analysis limit reached. Please try again tomorrow.";
    }
    if (message.includes("safety") || message.includes("finishReason: SAFETY")) {
      return "The AI was unable to analyze this product image due to safety filters. Please ensure the ingredient list is clearly visible.";
    }
    if (message.includes("network") || message.includes("fetch") || message.includes("offline")) {
      return "Network error. Please check your internet connection.";
    }
    return "Failed to analyze ingredients. Please ensure the photo is clear and try again.";
  };

  const analyzeIngredients = async () => {
    if (!image) return;
    setAnalyzing(true);
    setError(null);

    try {
      const base64Data = image.split(',')[1];
      
      const prompt = `
ACT AS: A Cosmetic Chemist and Skincare Formulation Expert.
TASK: Analyze the provided image of a skincare product ingredient list.

CONTEXT:
The user has a skin condition identified as: ${scanResult.top3Conditions[0].name}.

STEPS:
1. OCR EXTRACTION: Extract all visible ingredients from the image.
2. CATEGORIZATION: Identify which ingredients are:
   - "High Risk" (Common irritants/allergens like Denatured Alcohol, Fragrance, Sulfates).
   - "Comedogenic" (Pore-clogging ingredients like Coconut Oil or Isopropyl Myristate).
   - "Active" (Beneficial ingredients like Niacinamide, Hyaluronic Acid).
3. PERSONALIZED MATCH: Cross-reference these with the user's scan result. 
   - Example: If the user has Eczema, flag Fragrance and Alcohol as "Immediate Avoid."

OUTPUT FORMAT (JSON):
{
  "summary": "A 2-sentence verdict on the product's safety for the user's current skin condition.",
  "redFlags": ["List of irritants found"],
  "chemistNote": "One tip on how to use it (e.g., 'Patch test on the jawline first')",
  "extractedIngredients": ["All extracted ingredients"]
}

DISCLAIMER: This is a chemical analysis of ingredients, not medical advice.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const analysis = JSON.parse(response.text || "{}");
      setResult(analysis);
    } catch (err: any) {
      console.error("Analysis error:", err);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="bg-navy p-6 flex items-center justify-between text-white">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-teal-primary rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Beaker className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Product Ingredient Analyzer</h3>
            <p className="text-[10px] text-teal-primary uppercase tracking-widest font-bold">Cosmetic Chemist Analysis</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      <div className="flex-grow overflow-y-auto p-6 space-y-8">
        {/* Upload Section */}
        {!result && !analyzing && (
          <div className="space-y-6">
            <div className="text-center">
              <h4 className="text-lg font-bold text-navy mb-2">Check your skincare products</h4>
              <p className="text-sm text-slate-500">Upload a photo of the ingredient list on your product's packaging.</p>
            </div>

            {!image ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-video border-4 border-dashed border-teal-100 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-teal-50/50 transition-all group"
              >
                <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Camera className="w-8 h-8 text-teal-primary" />
                </div>
                <p className="font-bold text-navy">Take a photo of ingredients</p>
                <p className="text-xs text-slate-400 mt-1">Ensure text is clear and readable</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative aspect-video rounded-3xl overflow-hidden border-4 border-white shadow-lg">
                  <img src={image} alt="Ingredients" className="w-full h-full object-cover" />
                  <button 
                    onClick={clearImage}
                    className="absolute top-4 right-4 bg-navy/80 text-white p-2 rounded-full hover:bg-navy transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <button 
                  onClick={analyzeIngredients}
                  className="w-full bg-teal-primary text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-teal-600 transition-all shadow-lg shadow-teal-500/20"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Analyze Ingredients</span>
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
          </div>
        )}

        {/* Loading State */}
        {analyzing && (
          <div className="py-20 text-center space-y-6">
            <Loader2 className="w-16 h-16 text-teal-primary animate-spin mx-auto" />
            <div>
              <h4 className="text-xl font-bold text-navy mb-2">Chemist is analyzing...</h4>
              <p className="text-sm text-slate-500">Scanning for irritants, comedogenic ingredients, and actives.</p>
            </div>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Summary Verdict */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-start space-x-4">
              <div className="w-12 h-12 bg-navy rounded-2xl flex items-center justify-center flex-shrink-0">
                <FileSearch className="w-6 h-6 text-teal-primary" />
              </div>
              <div>
                <h4 className="font-bold text-navy mb-1 uppercase tracking-widest text-xs">Chemist's Verdict</h4>
                <p className="text-slate-700 leading-relaxed">{result.summary}</p>
              </div>
            </div>

            {/* Red Flags */}
            <div className="space-y-4">
              <h4 className="font-bold text-navy flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-coral-urgency" />
                <span>Red Flags (Irritants Found)</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.redFlags.length > 0 ? result.redFlags.map((flag, i) => (
                  <div key={i} className="bg-red-50 text-red-700 p-3 rounded-xl text-sm font-medium border border-red-100 flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                    <span>{flag}</span>
                  </div>
                )) : (
                  <div className="col-span-2 bg-emerald-50 text-emerald-700 p-3 rounded-xl text-sm font-medium border border-emerald-100 flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>No major irritants detected.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Chemist's Note */}
            <div className="bg-teal-50 p-6 rounded-3xl border border-teal-100">
              <h4 className="font-bold text-teal-800 mb-2 flex items-center space-x-2">
                <Info className="w-5 h-5" />
                <span>Chemist's Note</span>
              </h4>
              <p className="text-teal-700 text-sm leading-relaxed italic">"{result.chemistNote}"</p>
            </div>

            {/* Extracted Ingredients (Collapsible) */}
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all">
                <span className="text-sm font-bold text-navy uppercase tracking-widest">Extracted Ingredients</span>
                <ChevronRight className="w-5 h-5 text-slate-400 group-open:rotate-90 transition-transform" />
              </summary>
              <div className="p-4 text-xs text-slate-500 leading-relaxed flex flex-wrap gap-2 mt-2">
                {result.extractedIngredients.map((ing, i) => (
                  <span key={i} className="bg-white border border-slate-200 px-2 py-1 rounded-md">{ing}</span>
                ))}
              </div>
            </details>

            <button 
              onClick={() => setResult(null)}
              className="w-full bg-navy text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-slate-800 transition-all"
            >
              <span>Analyze Another Product</span>
            </button>
          </motion.div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Footer Disclaimer */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 text-center uppercase tracking-widest font-bold">
        Disclaimer: Chemical analysis only. Not medical advice.
      </div>
    </div>
  );
}
