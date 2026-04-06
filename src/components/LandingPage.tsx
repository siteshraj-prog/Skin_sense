import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  Users, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  Stethoscope, 
  MapPin, 
  Activity, 
  Lock, 
  HelpCircle, 
  Search, 
  ArrowRight,
  Upload,
  ClipboardList,
  FileText
} from 'lucide-react';

const stats = [
  { label: 'Scans Completed', value: '10,000+', icon: Zap },
  { label: 'Preliminary Accuracy', value: '90%', icon: ShieldCheck },
  { label: 'Diagnosis Time', value: '< 2 min', icon: Activity },
  { label: 'Cost to Use', value: 'Free', icon: CheckCircle2 },
];

const painPoints = [
  { title: 'Common Health Issue', description: 'Skin conditions affect 1 in 4 people globally.', icon: Activity },
  { title: 'Doctor Shortage', description: 'Limited dermatologists in rural and semi-urban areas.', icon: Stethoscope },
  { title: 'Limited Infrastructure', description: 'Lack of specialized clinics in remote locations.', icon: MapPin },
  { title: 'Self-Diagnosis Risks', description: 'Incorrect self-treatment can worsen conditions.', icon: AlertCircle },
  { title: 'Lack of Awareness', description: 'Many ignore early symptoms of serious conditions.', icon: HelpCircle },
  { title: 'Medicine Misuse', description: 'Over-the-counter steroid abuse is a major concern.', icon: Lock },
  { title: 'Hospital Burden', description: 'Overcrowded hospitals for minor skin issues.', icon: Users },
  { title: 'Access Barriers', description: 'Travel costs and time off work prevent timely care.', icon: Search },
];

const steps = [
  { title: 'Upload Photo', description: 'Take a clear photo of the affected area.', icon: Upload },
  { title: 'Answer Survey', description: 'Complete 8 simple questions about your symptoms.', icon: ClipboardList },
  { title: 'Get Results', description: 'Receive a preliminary assessment and guidance.', icon: FileText },
];

export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative bg-navy py-20 lg:py-32 px-4 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-primary rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-primary rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight"
          >
            AI Skin Diagnosis — <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-primary to-teal-400">Accessible to Everyone</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Upload a photo, answer 8 questions, and get a preliminary assessment of your skin condition in under 2 minutes.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4"
          >
            <Link
              to="/diagnose"
              className="w-full sm:w-auto bg-teal-primary hover:bg-teal-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-xl hover:shadow-teal-500/20 flex items-center justify-center space-x-2"
            >
              <span>Start Diagnosis</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto border-2 border-slate-700 hover:border-teal-primary text-slate-300 hover:text-white px-8 py-4 rounded-xl font-bold text-lg transition-all"
            >
              How It Works
            </a>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20">
            {stats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className="glass-card bg-white/5 border-white/10 p-6 rounded-2xl"
              >
                <stat.icon className="w-8 h-8 text-teal-primary mx-auto mb-3" />
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">Why SkinSense?</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Addressing the critical gaps in dermatological care across India's diverse landscape.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {painPoints.map((point, idx) => (
              <motion.div
                key={point.title}
                whileHover={{ y: -5 }}
                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 bg-navy rounded-xl flex items-center justify-center mb-4 text-teal-primary">
                  <point.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-navy mb-2">{point.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{point.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">Simple 3-Step Process</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Our intuitive workflow is designed for everyone, regardless of technical expertise.
            </p>
          </div>
          <div className="relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
              {steps.map((step, idx) => (
                <div key={step.title} className="text-center">
                  <div className="relative inline-block mb-6">
                    <div className="w-20 h-20 bg-teal-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
                      <step.icon className="w-10 h-10" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-navy text-white rounded-full flex items-center justify-center font-bold text-sm border-4 border-white">
                      {idx + 1}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-navy mb-3">{step.title}</h3>
                  <p className="text-slate-500 leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-16 text-center">
            <Link
              to="/diagnose"
              className="inline-flex items-center space-x-2 bg-navy text-white px-8 py-4 rounded-xl font-bold hover:bg-slate-800 transition-all"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-5 h-5 text-teal-primary" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
