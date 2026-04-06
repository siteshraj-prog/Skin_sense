import React from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  ShieldCheck, 
  Globe, 
  Lightbulb, 
  Stethoscope, 
  AlertTriangle, 
  Heart, 
  Zap, 
  MessageSquare, 
  Bell, 
  Calendar, 
  UserPlus 
} from 'lucide-react';

const teamMembers = [
  { name: "Sitesh Raj", role: "Lead Developer & AI Integration", bio: "Passionate about leveraging technology for social impact." },
  { name: "Team RecycleX", role: "Innovation & Design", bio: "A collective focused on sustainable and accessible health solutions." }
];

const innovations = [
  { title: "Hybrid Analysis", description: "Combining image recognition with symptom-based logic for higher accuracy.", icon: Zap },
  { title: "Smart Triage", description: "Prioritizing cases based on clinical urgency indicators.", icon: ShieldCheck },
  { title: "Dermatologist Integration", description: "Direct links to professional care and location services.", icon: Stethoscope },
  { title: "Holistic Support", description: "Providing nutrition and home-care guidance alongside assessments.", icon: Heart }
];

const futureScope = [
  { title: "Multi-language Support", description: "Expanding to Hindi, Tamil, Bengali, and more for wider reach.", icon: Globe },
  { title: "Doctor Consultations", description: "Direct integration with online consultation APIs.", icon: UserPlus },
  { title: "Condition Expansion", description: "Expanding AI models to recognize 50+ skin conditions.", icon: Lightbulb },
  { title: "Follow-up Reminders", description: "Real-time notifications for medication and check-ups.", icon: Bell },
  { title: "Personalized Care Plans", description: "AI-generated skin care routines based on scan history.", icon: Calendar },
  { title: "Community Forum", description: "A safe space for users to share experiences and support.", icon: MessageSquare }
];

export default function AboutPage() {
  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero Section */}
      <section className="bg-navy py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-white mb-6"
          >
            About <span className="text-teal-primary">SkinSense</span>
          </motion.h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            SkinSense is an AI-assisted diagnostic support tool designed to bridge the gap in dermatological care for rural and semi-urban populations in India.
          </p>
        </div>
      </section>

      {/* Ethical Disclaimer */}
      <section className="py-12 px-4 -mt-10">
        <div className="max-w-4xl mx-auto bg-white border-l-8 border-coral-urgency p-8 rounded-2xl shadow-xl">
          <div className="flex items-start space-x-4">
            <AlertTriangle className="w-8 h-8 text-coral-urgency flex-shrink-0" />
            <div>
              <h2 className="text-xl font-bold text-navy mb-2 uppercase tracking-wider">Ethical Safeguards & Disclaimer</h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                SkinSense is built with a "Safety-First" approach. We acknowledge the limitations of AI in healthcare and have implemented the following safeguards:
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-medium text-slate-500">
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-coral-urgency rounded-full" />
                  <span>Preliminary guidance only — NOT a substitute for a doctor.</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-coral-urgency rounded-full" />
                  <span>Confidence scores capped at 90% to avoid false certainty.</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-coral-urgency rounded-full" />
                  <span>No PII stored without explicit user consent.</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-coral-urgency rounded-full" />
                  <span>Always recommends professional consultation.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-navy mb-4 flex items-center justify-center space-x-3">
              <Users className="w-8 h-8 text-teal-primary" />
              <span>Meet Team RecycleX</span>
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              A group of innovators dedicated to solving real-world health accessibility problems.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {teamMembers.map((member) => (
              <div key={member.name} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <Users className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-navy mb-1">{member.name}</h3>
                <p className="text-teal-primary font-semibold text-sm mb-4">{member.role}</p>
                <p className="text-slate-500 text-sm leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Innovation Highlights */}
      <section className="py-20 px-4 bg-navy text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Innovation Highlights</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              What sets SkinSense apart from generic diagnostic tools.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {innovations.map((item) => (
              <div key={item.title} className="bg-white/5 p-8 rounded-3xl border border-white/10">
                <item.icon className="w-10 h-10 text-teal-primary mb-6" />
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Future Scope */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-navy mb-4 flex items-center justify-center space-x-3">
              <Globe className="w-8 h-8 text-teal-primary" />
              <span>Future Scope</span>
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Our roadmap for expanding SkinSense into a comprehensive skin health ecosystem.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {futureScope.map((item) => (
              <div key={item.title} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-teal-50 text-teal-primary rounded-xl flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-navy mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
