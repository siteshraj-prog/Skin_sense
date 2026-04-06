import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { ScanResult, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  Calendar, 
  ChevronRight, 
  ShieldAlert, 
  Activity, 
  Search, 
  Filter, 
  Loader2, 
  AlertCircle, 
  ExternalLink 
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function ScanHistory({ user, profile }: { user: User, profile: UserProfile | null }) {
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, `scans/${user.uid}/results`),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const scanData: ScanResult[] = [];
      snapshot.forEach((doc) => {
        scanData.push({ id: doc.id, ...doc.data() } as ScanResult);
      });
      setScans(scanData);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching scans:", err);
      setError("Failed to load history. Please check your connection.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const filteredScans = scans.filter(scan => 
    scan.top3Conditions[0].name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scan.urgencyLevel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-bold text-navy flex items-center space-x-3">
              <History className="w-8 h-8 text-teal-primary" />
              <span>{profile ? `Hello, ${profile.displayName.split(' ')[0]}.` : "Scan History"}</span>
            </h1>
            <p className="text-slate-500 mt-2">
              {profile ? "Here is your skin health journey." : "Track your skin health journey over time."}
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search conditions or urgency..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-primary/20 focus:border-teal-primary transition-all shadow-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-teal-primary animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Loading your history...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 p-8 rounded-3xl text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-red-700 mb-2">Oops! Something went wrong</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition-all"
            >
              Try Again
            </button>
          </div>
        ) : filteredScans.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Activity className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-navy mb-2">No Scans Found</h3>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto">
              {searchTerm ? "No results match your search criteria." : "You haven't performed any scans yet. Start your first diagnosis today!"}
            </p>
            {!searchTerm && (
              <a 
                href="/diagnose"
                className="inline-flex items-center space-x-2 bg-teal-primary text-white px-8 py-4 rounded-xl font-bold hover:bg-teal-600 transition-all shadow-lg shadow-teal-500/20"
              >
                <span>Start Diagnosis</span>
                <ChevronRight className="w-5 h-5" />
              </a>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredScans.map((scan, idx) => (
                <motion.div
                  key={scan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center space-x-6">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 border-2 border-white shadow-sm">
                        {scan.imageUrl ? (
                          <img src={scan.imageUrl} alt="Scan" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Activity className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="text-lg font-bold text-navy">{scan.top3Conditions[0].name}</h3>
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border",
                            scan.urgencyLevel === 'HIGH' ? "bg-red-50 text-red-600 border-red-100" :
                            scan.urgencyLevel === 'MEDIUM' ? "bg-amber-50 text-amber-600 border-amber-100" :
                            "bg-emerald-50 text-emerald-600 border-emerald-100"
                          )}>
                            {scan.urgencyLevel}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-slate-400">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(scan.timestamp).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <ShieldAlert className="w-4 h-4" />
                            <span>{scan.top3Conditions[0].confidence}% Confidence</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button className="flex-1 md:flex-none bg-slate-50 text-navy px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all flex items-center justify-center space-x-2">
                        <span>View Details</span>
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
