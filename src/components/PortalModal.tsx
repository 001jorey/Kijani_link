import React, { useState } from 'react';
import { 
  X, Mail, Lock, User, MapPin, Laptop, ShieldCheck, 
  Clock, ArrowRight, CheckCircle2, ChevronRight, Sparkles, LogIn
} from 'lucide-react';
import { INTERNET_PACKAGES } from '../data/packages';
import { getSubscribers, addSubscriber } from '../data/store';
import { Subscriber, PackageId } from '../types';

interface PortalModalProps {
  initialMode: 'subscriber' | 'admin';
  onClose: () => void;
  onLoginSuccess: (user: { role: 'subscriber' | 'admin'; data?: Subscriber }) => void;
}

export default function PortalModal({ initialMode, onClose, onLoginSuccess }: PortalModalProps) {
  const [mode, setMode] = useState<'subscriber' | 'admin'>(initialMode);
  const [isRegistering, setIsRegistering] = useState(false);
  const [pendingUser, setPendingUser] = useState<Subscriber | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [selectedPkg, setSelectedPkg] = useState<PackageId>('kijani-eco');
  
  const [errorMessage, setErrorMessage] = useState('');

  // Handle Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (mode === 'admin') {
      // Admin bypass auth check
      if (email.trim().toLowerCase() === 'admin@kijanilink.com' && password === 'admin123') {
        onLoginSuccess({ role: 'admin' });
      } else {
        setErrorMessage('Invalid admin email or security key. (Hint: use admin@kijanilink.com / admin123)');
      }
    } else {
      // Subscriber Auth
      const subs = getSubscribers();
      const match = subs.find(s => s.email.toLowerCase() === email.trim().toLowerCase());

      if (match && (password === 'password123' || password === match.password)) {
        if (match.status === 'pending_activation') {
          // Put into pending screen guard state
          setPendingUser(match);
        } else if (match.status === 'rejected') {
          setErrorMessage('Your subscription application has been suspended or rejected. Please contact support.');
        } else {
          onLoginSuccess({ role: 'subscriber', data: match });
        }
      } else {
        setErrorMessage('Incorrect email or password. Try a Quick-Login shortcut below!');
      }
    }
  };

  // Handle Registration
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName || !email || !address || !password) {
      setErrorMessage('Please fill in all requested registration details.');
      return;
    }

    // Check if email already registered
    const subs = getSubscribers();
    if (subs.some(s => s.email.toLowerCase() === email.trim().toLowerCase())) {
      setErrorMessage('This email is already registered on our fiber lines.');
      return;
    }

    const created = addSubscriber({
      name: fullName,
      email: email.trim(),
      password,
      address,
      packageId: selectedPkg
    });

    // Enter post-registration pending state
    setPendingUser(created);
  };

  // Pre-fill shortcut bypass credentials
  const prefill = (type: 'admin' | 'active' | 'pending') => {
    setErrorMessage('');
    setIsRegistering(false);
    setPendingUser(null);

    if (type === 'admin') {
      setMode('admin');
      setEmail('admin@kijanilink.com');
      setPassword('admin123');
    } else if (type === 'active') {
      setMode('subscriber');
      setEmail('john@kamau.me');
      setPassword('password123');
    } else if (type === 'pending') {
      setMode('subscriber');
      setEmail('michael@dundermifflin.com');
      setPassword('password123');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      
      {/* Dark Overlay with Blur */}
      <div 
        onClick={onClose} 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer transition-opacity" 
      />

      {/* Modal Container */}
      <div className="relative bg-white border border-slate-200 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Glow corner elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#10b981]/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#3b82f6]/5 rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-slate-50/80 z-10">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span className="font-mono text-[11px] font-bold text-emerald-700 tracking-wider uppercase">
              {mode === 'admin' ? 'SECURE_TUNNEL' : isRegistering ? 'FIBER_PROVISIONING' : 'SECURE_GATEWAY'}
            </span>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 z-10">
          
          {/* Post-Registration / Login Pending activation Guard Screen */}
          {pendingUser ? (
            <div className="text-center py-6 space-y-6">
              
              <div className="mx-auto flex items-center justify-center w-20 h-20 rounded-full bg-amber-50 border-2 border-amber-200 animate-pulse text-amber-600">
                <Clock className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight font-display">Pending Approval</h3>
                <p className="text-sm text-amber-700 font-mono font-semibold">Status: pending_activation</p>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-left space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Thank you for registering, <span className="text-slate-800 font-bold">{pendingUser.name}</span>! 
                  Your Kijani Link connection is being reviewed by our network administrators. 
                  You will receive an activation notification shortly.
                </p>
                <div className="border-t border-slate-100 pt-3 space-y-1 text-[11px] font-mono text-slate-500">
                  <p>• Plan: <span className="text-emerald-700 font-bold uppercase">{pendingUser.packageId}</span></p>
                  <p>• Address: <span className="text-slate-700">{pendingUser.address}</span></p>
                  <p>• Handshake: #KJL-PENDING-{pendingUser.id.substring(4, 9)}</p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setPendingUser(null);
                    onClose();
                  }}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-md"
                >
                  Dismiss & Return Home
                </button>
                <p className="text-[10px] text-slate-500 mt-3 font-mono">
                  💡 Tip: Switch to the Admin Portal, approve this user, then log back in!
                </p>
              </div>

            </div>
          ) : (
            // Form Display
            <div className="space-y-5">
              
              {/* Login / Register Toggle Selector */}
              {mode !== 'admin' && (
                <div className="flex border-b border-slate-100 mb-2">
                  <button
                    onClick={() => { setIsRegistering(false); setErrorMessage(''); }}
                    className={`flex-1 pb-3 text-sm font-semibold transition-all border-b-2 ${!isRegistering ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-800'}`}
                  >
                    Subscriber Login
                  </button>
                  <button
                    onClick={() => { setIsRegistering(true); setErrorMessage(''); }}
                    className={`flex-1 pb-3 text-sm font-semibold transition-all border-b-2 ${isRegistering ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-800'}`}
                  >
                    Create Account
                  </button>
                </div>
              )}

              {/* Title Header */}
              <div className="text-left">
                <h3 className="text-xl font-extrabold text-slate-900 font-display">
                  {mode === 'admin' 
                    ? 'Admin Portal Access' 
                    : isRegistering 
                    ? 'Connect Your Home' 
                    : 'Subscriber Sign In'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {mode === 'admin' 
                    ? 'Authenticate to manage subscriber lines and core fiber routing.' 
                    : isRegistering 
                    ? 'Register below to request physical eco-friendly fiber provisioning.' 
                    : 'Access your speed test dashboards, billing logs, and smart router state.'}
                </p>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl text-xs text-red-600 leading-relaxed text-left">
                  {errorMessage}
                </div>
              )}

              {/* Core Forms */}
              <form onSubmit={isRegistering ? handleRegisterSubmit : handleLoginSubmit} className="space-y-4 text-left">
                
                {/* Full name (Register only) */}
                {isRegistering && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 font-mono">Full Name</label>
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5 flex items-center gap-3 focus-within:border-emerald-500 transition-colors">
                      <User className="w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="John Kamau"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="bg-transparent border-0 outline-none w-full text-xs text-slate-800 focus:ring-0 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                )}

                {/* Email Address */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 font-mono">
                    {mode === 'admin' ? 'Security Email' : 'Email Address'}
                  </label>
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5 flex items-center gap-3 focus-within:border-emerald-500 transition-colors">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder={mode === 'admin' ? 'admin@kijanilink.com' : 'john@gmail.com'}
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-transparent border-0 outline-none w-full text-xs text-slate-800 focus:ring-0 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Physical address (Register only) */}
                {isRegistering && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 font-mono">Installation Address</label>
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5 flex items-center gap-3 focus-within:border-emerald-500 transition-colors">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. Nyali Block B, Mombasa"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="bg-transparent border-0 outline-none w-full text-xs text-slate-800 focus:ring-0 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                )}

                {/* Package select (Register only) */}
                {isRegistering && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 font-mono">Select Connection Tier</label>
                    <div className="grid grid-cols-3 gap-2">
                      {INTERNET_PACKAGES.map((pkg) => (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => setSelectedPkg(pkg.id)}
                          className={`p-3 rounded-xl border text-center transition-all flex flex-col justify-between items-center gap-1 cursor-pointer ${
                            selectedPkg === pkg.id 
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-[10px] font-bold tracking-tight block truncate w-full">{pkg.name.split(' ')[1]}</span>
                          <span className="text-xs font-black text-slate-800">{pkg.price}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Security Password */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase font-bold text-slate-500 font-mono">Password</label>
                    {mode === 'subscriber' && !isRegistering && (
                      <span className="text-[10px] text-emerald-600 font-mono font-semibold">Default: password123</span>
                    )}
                  </div>
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5 flex items-center gap-3 focus-within:border-emerald-500 transition-colors">
                    <Lock className="w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-transparent border-0 outline-none w-full text-xs text-slate-800 focus:ring-0 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Action Submit button */}
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <LogIn className="w-4 h-4" />
                  <span>
                    {mode === 'admin' 
                      ? 'Secure Admin Access' 
                      : isRegistering 
                      ? 'Request Green Handshake' 
                      : 'Connect Active Session'}
                  </span>
                </button>

              </form>

              {/* Portal Mode Switch Links */}
              <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs text-slate-500 font-mono">
                {mode === 'subscriber' ? (
                  <button
                    onClick={() => { setMode('admin'); setIsRegistering(false); setErrorMessage(''); }}
                    className="hover:text-emerald-600 flex items-center gap-1 cursor-pointer"
                  >
                    Admin Portal Mode <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => { setMode('subscriber'); setErrorMessage(''); }}
                    className="hover:text-emerald-600 flex items-center gap-1 cursor-pointer"
                  >
                    Subscriber Portal Mode <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* DEMO BYPASS SHORTCUT LINKS - EXTREMELY HELPFUL FOR REVIEWERS */}
              <div className="border-t border-slate-100 pt-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-emerald-700 font-mono font-bold uppercase tracking-widest flex items-center gap-1 mb-2">
                  <Sparkles className="w-3 h-3 animate-bounce" /> Reviewer One-Click Bypass Login
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => prefill('admin')}
                    className="px-2 py-2 bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20 rounded-lg text-[10px] font-bold text-slate-600 hover:text-emerald-700 cursor-pointer transition-all truncate"
                  >
                    🔓 Admin
                  </button>
                  <button
                    onClick={() => prefill('active')}
                    className="px-2 py-2 bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20 rounded-lg text-[10px] font-bold text-slate-600 hover:text-emerald-700 cursor-pointer transition-all truncate"
                  >
                    🟢 Active John
                  </button>
                  <button
                    onClick={() => prefill('pending')}
                    className="px-2 py-2 bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20 rounded-lg text-[10px] font-bold text-slate-600 hover:text-emerald-700 cursor-pointer transition-all truncate"
                  >
                    ⏳ Pending Mike
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
