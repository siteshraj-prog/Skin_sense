import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Shield, Menu, X, LogIn, LogOut, History, Info, Home, Dna, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import LandingPage from './components/LandingPage';
import DiagnosisFlow from './components/DiagnosisFlow';
import AboutPage from './components/AboutPage';
import Auth from './components/Auth';
import ScanHistory from './components/History';
import ProfileSetup from './components/ProfileSetup';
import { cn } from './lib/utils';
import { UserProfile } from './types';

function DisclaimerBanner() {
  return (
    <div className="bg-coral-urgency text-white py-2 px-4 text-center text-sm font-medium sticky top-0 z-50">
      This tool provides preliminary guidance only and is NOT a substitute for professional medical diagnosis. Always consult a qualified dermatologist.
    </div>
  );
}

function Navbar({ user, profile }: { user: User | null, profile: UserProfile | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Diagnose', path: '/diagnose', icon: Shield },
    { name: 'About', path: '/about', icon: Info },
    ...(user ? [{ name: 'History', path: '/history', icon: History }] : []),
  ];

  return (
    <nav className="bg-navy text-white sticky top-[36px] z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Dna className="w-8 h-8 text-teal-primary" />
            <span className="text-xl font-bold tracking-tight">SkinSense</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-teal-primary",
                  location.pathname === link.path ? "text-teal-primary" : "text-slate-300"
                )}
              >
                {link.name}
              </Link>
            ))}
            {user ? (
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2 text-teal-primary font-bold">
                  <UserIcon className="w-5 h-5" />
                  <span className="text-sm">{profile?.displayName || user.email?.split('@')[0]}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-sm font-medium text-slate-300 hover:text-coral-urgency transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-teal-primary hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg"
              >
                Get Started
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-300 hover:text-white">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-navy-light border-t border-slate-800"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "block px-3 py-2 rounded-md text-base font-medium",
                    location.pathname === link.path ? "bg-slate-800 text-teal-primary" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <link.icon className="w-5 h-5" />
                    <span>{link.name}</span>
                  </div>
                </Link>
              ))}
              {!user && (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center bg-teal-primary text-white px-4 py-2 rounded-lg font-semibold"
                >
                  Login / Signup
                </Link>
              )}
              {user && (
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-slate-300 hover:text-coral-urgency"
                >
                  <div className="flex items-center space-x-3">
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </div>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="bg-navy text-slate-400 py-12 px-4 border-t border-slate-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center space-x-2 text-white mb-4">
            <Dna className="w-6 h-6 text-teal-primary" />
            <span className="text-xl font-bold">SkinSense</span>
          </div>
          <p className="text-sm leading-relaxed">
            Empowering rural and semi-urban populations with accessible, AI-assisted skin health guidance.
          </p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-teal-primary transition-colors">Home</Link></li>
            <li><Link to="/diagnose" className="hover:text-teal-primary transition-colors">Start Diagnosis</Link></li>
            <li><Link to="/about" className="hover:text-teal-primary transition-colors">About Team RecycleX</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Legal & Ethical</h4>
          <p className="text-xs leading-relaxed mb-4">
            SkinSense is a support tool, not a diagnostic device. All data is handled according to our privacy policy.
          </p>
          <p className="text-xs font-bold text-coral-urgency uppercase tracking-wider">
            Medical Disclaimer: Always consult a doctor.
          </p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-800 text-center text-xs">
        &copy; {new Date().getFullYear()} SkinSense by Team RecycleX. All rights reserved.
      </div>
    </footer>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Check if profile exists
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
            setShowProfileSetup(false);
          } else {
            setShowProfileSetup(true);
          }
        } catch (err) {
          console.error("Error fetching profile:", err);
        }
      } else {
        setProfile(null);
        setShowProfileSetup(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-primary"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <DisclaimerBanner />
        <Navbar user={user} profile={profile} />
        <main className="flex-grow">
          {showProfileSetup && user && (
            <ProfileSetup 
              uid={user.uid} 
              onComplete={(newProfile) => {
                setProfile(newProfile);
                setShowProfileSetup(false);
              }} 
            />
          )}
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/diagnose" element={<DiagnosisFlow user={user} profile={profile} />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/login" element={<Auth mode="login" />} />
            <Route path="/signup" element={<Auth mode="signup" />} />
            <Route path="/history" element={user ? <ScanHistory user={user} profile={profile} /> : <Auth mode="login" />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
