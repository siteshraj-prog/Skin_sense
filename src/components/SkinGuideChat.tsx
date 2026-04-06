import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Send, 
  X, 
  Loader2, 
  User, 
  Bot, 
  AlertTriangle,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { ScanResult } from '../types';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface SkinGuideChatProps {
  scanResult: ScanResult;
  onClose?: () => void;
}

export default function SkinGuideChat({ scanResult, onClose }: SkinGuideChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const systemInstruction = `
ACT AS: SkinGuide AI, a supportive medical assistant specialized in dermatology. 
CORE ATTRIBUTE: You are NOT a doctor. You provide information, not a final diagnosis.

CONTEXT INJECTION:
[SCAN_RESULT]: ${scanResult.top3Conditions[0].name}
[ACCURACY_CONFIDENCE]: ${scanResult.top3Conditions[0].confidence}%
[USER_SYMPTOMS]: ${JSON.stringify(scanResult.surveyAnswers)}

OPERATIONAL GUIDELINES:
1. TONAL IDENTITY: Be empathetic, calm, and professional. Use phrases like "I understand this is stressful" if the user sounds anxious (Emotional Support Mode).
2. RESULT EXPLANATION: Explain the [SCAN_RESULT] conversationally. If it's Eczema, explain it’s chronic but manageable. Mention common triggers like dry skin or stress.
3. APPOINTMENT PREP: If asked for a "doctor list," generate 4-5 specific questions for a dermatologist (e.g., "Is this contact or atopic?").
4. ESCALATION DETECTION (CRITICAL): If the user mentions "fever," "pus," "spreading rapidly," or "extreme pain," immediately trigger an URGENCY WARNING. Direct them to see a doctor or visit an ER immediately.
5. MULTI-LANGUAGE: Natively support Hindi, Tamil, and Bengali if the user switches languages.
6. PRODUCT CHECKER: If a user asks about a cream, flag common irritants for their specific [SCAN_RESULT].

CONSTRAINTS:
- NEVER say "You have [Condition]." Always say "Your scan aligns with [Condition]" or "The top match is [Condition]."
- ALWAYS append a medical disclaimer to the end of your first response: "Disclaimer: I am an AI assistant, not a doctor. Please consult a healthcare professional for clinical diagnosis."
- Keep responses concise and use bullet points for readability.

DYNAMIC QUICK REPLIES:
At the end of every response, suggest 3 short follow-up chips based on the context (e.g., "What triggers this?", "Safe creams?", "Diet tips"). 
Format the quick replies as a JSON array at the very end of your response, like this: [QUICK_REPLIES: ["Reply 1", "Reply 2", "Reply 3"]]
`;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initial greeting
    const greet = async () => {
      setLoading(true);
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: "Hello! Please introduce yourself and explain my scan result.",
          config: {
            systemInstruction: systemInstruction,
          },
        });

        const text = response.text || "";
        processAiResponse(text);
      } catch (error) {
        console.error("Chat error:", error);
        setMessages([{ role: 'model', text: "I'm sorry, I'm having trouble connecting right now. Please try again later." }]);
      } finally {
        setLoading(false);
      }
    };

    greet();
  }, []);

  const processAiResponse = (fullText: string) => {
    const quickReplyMatch = fullText.match(/\[QUICK_REPLIES:\s*(\[.*?\])\]/);
    let cleanText = fullText;
    let replies: string[] = [];

    if (quickReplyMatch) {
      cleanText = fullText.replace(quickReplyMatch[0], "").trim();
      try {
        replies = JSON.parse(quickReplyMatch[1]);
      } catch (e) {
        console.error("Failed to parse quick replies", e);
      }
    }

    setMessages(prev => [...prev, { role: 'model', text: cleanText }]);
    setQuickReplies(replies);
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = { role: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setQuickReplies([]);

    try {
      const chatHistory = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [...chatHistory, { role: 'user', parts: [{ text }] }],
        config: {
          systemInstruction: systemInstruction,
        },
      });

      const aiText = response.text || "";
      processAiResponse(aiText);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I encountered an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="bg-navy p-4 flex items-center justify-between text-white">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-teal-primary rounded-full flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold">SkinGuide AI</h3>
            <p className="text-[10px] text-teal-primary uppercase tracking-widest font-bold">Support Assistant</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex items-start space-x-2 max-w-[85%]",
              msg.role === 'user' ? "ml-auto flex-row-reverse space-x-reverse" : ""
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
              msg.role === 'user' ? "bg-navy text-white" : "bg-teal-primary text-white"
            )}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={cn(
              "p-3 rounded-2xl text-sm shadow-sm",
              msg.role === 'user' 
                ? "bg-navy text-white rounded-tr-none" 
                : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
            )}>
              <div className="whitespace-pre-wrap leading-relaxed">
                {msg.text}
              </div>
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex items-start space-x-2">
            <div className="w-8 h-8 bg-teal-primary rounded-full flex items-center justify-center text-white">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100">
              <Loader2 className="w-4 h-4 animate-spin text-teal-primary" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      <AnimatePresence>
        {quickReplies.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-4 py-2 flex flex-wrap gap-2 bg-slate-50/50"
          >
            {quickReplies.map((reply, i) => (
              <button
                key={i}
                onClick={() => handleSend(reply)}
                className="text-xs bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full hover:border-teal-primary hover:text-teal-primary transition-all shadow-sm"
              >
                {reply}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
        className="p-4 bg-white border-t border-slate-100 flex items-center space-x-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your results, triggers, or care..."
          className="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-primary/20 focus:border-teal-primary transition-all"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-teal-primary text-white p-3 rounded-xl hover:bg-teal-600 transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
