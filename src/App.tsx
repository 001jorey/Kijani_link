import React, { useState, useEffect } from 'react';
import { 
  Leaf, Wifi, ShieldAlert, Cpu, Heart, CheckCircle2, 
  ArrowRight, Mail, MapPin, Globe, Activity, Award, Zap, HelpCircle,
  Layers, Settings, CreditCard, Calendar, TrendingUp, Sparkles,
  Clock, ArrowUpRight, Lock, Briefcase, Menu, X, Check
} from 'lucide-react';
import Navbar from './components/Navbar';
import Network3D from './components/Network3D';
import PortalModal from './components/PortalModal';
import SubscriberDashboard from './components/SubscriberDashboard';
import AdminDashboard from './components/AdminDashboard';
import GmailSupportForm from './components/GmailSupportForm';
// @ts-ignore
import vrCharacterImg from './assets/images/vr_workflow_character_1784053855586.jpg';
import { INTERNET_PACKAGES } from './data/packages';
import { getSubscribers } from './data/store';
import { Subscriber, PackageId } from './types';

export default function App() {
  const [portalMode, setPortalMode] = useState<'subscriber' | 'admin' | null>(null);
  const [activeSession, setActiveSession] = useState<{ role: 'subscriber' | 'admin'; data?: Subscriber } | null>(null);
  const [hoveredNode, setHoveredNode] = useState<{ name: string; type: string; metric: string; status: string; x: number; y: number } | null>(null);
  
  const [signUpEmail, setSignUpEmail] = useState('');
  const [isSignedUp, setIsSignedUp] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Auto-refresh subscriber data if logged in
  const refreshActiveSubscriber = (id: string) => {
    const subs = getSubscribers();
    const found = subs.find(s => s.id === id);
    if (found) {
      setActiveSession({ role: 'subscriber', data: found });
    }
  };

  const handleOpenPortal = (mode: 'subscriber' | 'admin') => {
    setPortalMode(mode);
  };

  const handleClosePortal = () => {
    setPortalMode(null);
  };

  const handleLoginSuccess = (session: { role: 'subscriber' | 'admin'; data?: Subscriber }) => {
    setActiveSession(session);
    setPortalMode(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    setActiveSession(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScrollToSection = (id: string) => {
    if (activeSession) {
      // If inside portal, exit first
      setActiveSession(null);
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Pre-fill package selection during registration modal
  const handleOrderPackage = (pkgId: PackageId) => {
    setPortalMode('subscriber');
    // We can simulate opening the register tab by setting local storage/flags or just letting the modal open
  };

  return (
    <div className="font-sans min-h-screen selection:bg-emerald-500/30 selection:text-emerald-200 transition-colors duration-500 bg-[#060814] text-slate-100">
      
      {/* RENDER ACTIVE ADMIN SESSION */}
      {activeSession?.role === 'admin' ? (
        <AdminDashboard 
          onLogout={handleLogout} 
          onRefreshData={() => {
            // Keep state synchronous
          }}
        />
      ) : activeSession?.role === 'subscriber' && activeSession.data ? (
        /* RENDER ACTIVE SUBSCRIBER SESSION */
        <SubscriberDashboard 
          subscriber={activeSession.data} 
          onLogout={handleLogout}
          onRefreshSubscriber={refreshActiveSubscriber}
        />
      ) : (
        /* VIBRANT & MODERN LANDING PAGE WITH GLASSMORPHISM INTERFACE */
        <main className="relative min-h-screen flex flex-col lg:flex-row w-full font-sans antialiased text-slate-100">
          
          {/* Deep Perspective Background Grid & Glowing 3D Spheres */}
          <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40 pointer-events-none z-0" />
          <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.03)_0%,transparent_80%)] pointer-events-none" />

          {/* LARGE GLOWING 3D SPHERES (Layered Perspective) */}
          {/* Neon Pink Sphere - Left/Center Layer */}
          <div className="fixed top-[15%] left-[-5%] sm:left-[5%] w-48 h-48 sm:w-80 sm:h-80 rounded-full bg-gradient-to-br from-pink-500 via-rose-600 to-rose-950 opacity-60 blur-xs shadow-[0_0_100px_rgba(244,63,94,0.4),inset_-20px_-20px_50px_rgba(0,0,0,0.7)] pointer-events-none animate-float z-0" />
          
          {/* Neon Cyan Sphere - Right/Bottom Layer */}
          <div className="fixed bottom-[10%] right-[-5%] sm:right-[10%] w-56 h-56 sm:w-96 sm:h-96 rounded-full bg-gradient-to-br from-cyan-400 via-blue-600 to-blue-950 opacity-60 blur-xs shadow-[0_0_120px_rgba(6,182,212,0.45),inset_-25px_-25px_60px_rgba(0,0,0,0.7)] pointer-events-none animate-float-reverse z-0" />
          
          {/* Neon Yellow Sphere - Upper Right Layer */}
          <div className="fixed top-[8%] right-[12%] w-36 h-36 sm:w-60 sm:h-60 rounded-full bg-gradient-to-br from-yellow-300 via-amber-500 to-amber-950 opacity-45 blur-xs shadow-[0_0_80px_rgba(234,179,8,0.35),inset_-15px_-15px_40px_rgba(0,0,0,0.7)] pointer-events-none animate-float-slow z-0" />

          {/* Extra Background Sparkles & Orbs for Depth */}
          <div className="fixed top-1/4 right-1/3 w-2 h-2 rounded-full bg-white/60 animate-pulse shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
          <div className="fixed bottom-1/3 left-1/4 w-3.5 h-3.5 rounded-full bg-cyan-400/40 blur-xs animate-pulse" />
          <div className="fixed top-2/3 right-1/5 w-1.5 h-1.5 rounded-full bg-pink-400/60 animate-pulse" />

          {/* 1. FROSTED-GLASS VERTICAL NAVIGATION SIDEBAR (LEFT) */}
          {/* Desktop Sidebar (Fixed) */}
          <aside className="hidden lg:flex fixed left-6 top-6 bottom-6 w-68 z-40 rounded-3xl backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] p-6 flex-col justify-between overflow-y-auto">
            <div className="space-y-8">
              {/* Sidebar Logo */}
              <div className="flex items-center gap-3 border-b border-white/[0.06] pb-5">
                <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/10 border border-white/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                  <Leaf className="w-5 h-5 text-emerald-400" />
                  <Wifi className="w-5 h-5 text-blue-400/30 absolute" />
                </div>
                <div>
                  <h2 className="font-display font-black text-base tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    Kijani Link
                  </h2>
                  <span className="block text-[8px] tracking-widest text-emerald-400 uppercase font-mono font-bold -mt-0.5">
                    ECO-WORKFLOW
                  </span>
                </div>
              </div>

              {/* Navigation Tabs List */}
              <nav className="space-y-2">
                {[
                  { id: 'home', label: 'Business Workflow', icon: Briefcase },
                  { id: 'packages', label: 'Fiber Packages', icon: Zap },
                  { id: 'network', label: 'Live Network 3D', icon: Activity },
                  { id: 'impact', label: 'Eco Impact Metrics', icon: Leaf },
                  { id: 'email', label: 'Priority Support', icon: Mail },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleScrollToSection(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-semibold text-xs border text-left cursor-pointer bg-transparent border-transparent text-slate-400 hover:text-slate-100 hover:bg-white/[0.02]`}
                    >
                      <Icon className={`w-4 h-4 transition-transform duration-300 text-slate-400`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Sidebar Foot: Portal Access CTAs */}
            <div className="space-y-4 pt-6 border-t border-white/[0.06]">
              <p className="text-[9px] uppercase tracking-wider text-slate-500 font-mono font-bold px-4">
                SECURE BRIDGE PORTALS
              </p>
              
              <div className="space-y-2">
                <button
                  onClick={() => handleOpenPortal('subscriber')}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:text-emerald-300 text-slate-300 text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer text-left"
                >
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Subscriber Login</span>
                  <ArrowUpRight className="w-3 h-3 ml-auto opacity-40 group-hover:opacity-100" />
                </button>

                <button
                  onClick={() => handleOpenPortal('admin')}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-950/40 border border-white/[0.05] hover:border-blue-500/40 hover:bg-blue-500/5 hover:text-blue-300 text-slate-400 text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer text-left"
                >
                  <Lock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Admin Console</span>
                  <ArrowUpRight className="w-3 h-3 ml-auto opacity-40" />
                </button>
              </div>

              <div className="text-[9px] text-slate-600 text-center font-mono pt-1">
                © 2026 Kijani • Solar Backbone
              </div>
            </div>
          </aside>

          {/* Mobile Navigation Header */}
          <header className="lg:hidden fixed top-4 left-4 right-4 h-16 rounded-2xl backdrop-blur-xl bg-slate-950/40 border border-white/10 flex items-center justify-between px-4 z-40 shadow-xl">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/20 border border-white/10">
                <Leaf className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="font-display font-black text-sm tracking-tight text-white">
                Kijani Link
              </span>
            </div>
            
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="p-2 text-slate-300 hover:text-white transition-colors"
            >
              {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </header>

          {/* Mobile Frosted Sidebar Drawer */}
          {mobileSidebarOpen && (
            <div className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)}>
              <aside 
                className="absolute top-4 left-4 bottom-4 w-72 rounded-3xl backdrop-blur-2xl bg-slate-950/90 border border-white/10 p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-8">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-white/10 flex items-center justify-center">
                        <Leaf className="w-4 h-4 text-emerald-400" />
                      </div>
                      <span className="font-display font-black text-sm tracking-tight text-white">Kijani Link</span>
                    </div>
                    <button onClick={() => setMobileSidebarOpen(false)} className="text-slate-400 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <nav className="space-y-2">
                    {[
                      { id: 'home', label: 'Business Workflow', icon: Briefcase },
                      { id: 'packages', label: 'Fiber Packages', icon: Zap },
                      { id: 'network', label: 'Live Network 3D', icon: Activity },
                      { id: 'impact', label: 'Eco Impact Metrics', icon: Leaf },
                      { id: 'email', label: 'Priority Support', icon: Mail },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            handleScrollToSection(item.id);
                            setMobileSidebarOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-xs border text-left cursor-pointer bg-transparent border-transparent text-slate-400`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/[0.08]">
                  <p className="text-[9px] uppercase tracking-wider text-slate-500 font-mono font-bold px-2">
                    BRIDGE PORTALS
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        handleOpenPortal('subscriber');
                        setMobileSidebarOpen(false);
                      }}
                      className="w-full flex items-center gap-3 py-3 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-300 text-xs font-semibold"
                    >
                      <Clock className="w-4 h-4 text-emerald-400" />
                      <span>Subscriber Login</span>
                    </button>
                    <button
                      onClick={() => {
                        handleOpenPortal('admin');
                        setMobileSidebarOpen(false);
                      }}
                      className="w-full flex items-center gap-3 py-3 px-4 rounded-xl bg-slate-950 border border-white/[0.05] text-slate-400 text-xs font-semibold"
                    >
                      <Lock className="w-4 h-4 text-blue-400" />
                      <span>Admin Console</span>
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          )}

          {/* 2. FLOATING TRANSLUCENT MAIN CARD AREA - SCROLLABLE */}
          <div className="flex-1 lg:pl-80 pr-4 pl-4 lg:pr-8 py-6 pt-24 lg:py-6 flex flex-col gap-12 relative z-10 w-full overflow-y-auto">
            
            {/* SECTION: BUSINESS WORKFLOW LANDING CORE */}
            <div id="home" className="backdrop-blur-2xl bg-white/[0.02] border border-white/[0.08] shadow-[0_32px_80px_rgba(0,0,0,0.55)] rounded-[40px] p-6 sm:p-8 lg:p-14 max-w-5xl w-full relative overflow-hidden transition-all duration-500 hover:border-white/[0.12]">
              {/* Embedded dynamic light flare backing the 3D VR image */}
              <div className="absolute -right-32 -top-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute -left-32 -bottom-32 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
                
                {/* Left Half: Bold Copywriting & Sign Up Form */}
                <div className="lg:col-span-7 space-y-6 text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[9px] font-bold font-mono text-emerald-400 uppercase tracking-widest">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span>SOLAR FIBER MULTI-LINK</span>
                  </div>

                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] text-white font-display">
                    Business <br className="hidden sm:inline" />
                    <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                      Workflow
                    </span>
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl font-sans">
                    Supercharge your enterprise operations with uninterrupted light-speed fiber, backed by resilient regional solar-powered micro-grid storage. Kijani Link delivers high-performance symmetrical throughput with a zero-carbon digital handshake.
                  </p>

                  {/* Email Input & dark pill-shaped SIGN UP button */}
                  <div className="pt-2">
                    {isSignedUp ? (
                      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-emerald-300 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-300">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Workspace registered! Check your inbox for the solar bridge connection invite.</span>
                      </div>
                    ) : (
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (signUpEmail.trim()) {
                            setIsSignedUp(true);
                            setSignUpEmail('');
                          }
                        }}
                        className="flex flex-col sm:flex-row gap-3 w-full max-w-lg relative"
                      >
                        <div className="relative flex-1">
                          <Mail className="absolute left-4.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                          <input 
                            type="email"
                            required
                            value={signUpEmail}
                            onChange={(e) => setSignUpEmail(e.target.value)}
                            placeholder="Enter business email..."
                            className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-12 pr-6 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/50 transition-all font-sans"
                          />
                        </div>
                        
                        <button
                          type="submit"
                          className="py-4 px-8 bg-slate-950 text-white border border-white/10 hover:border-emerald-500/30 rounded-full font-bold text-xs tracking-wider uppercase transition-all duration-300 hover:bg-slate-900 shadow-xl hover:shadow-[0_0_25px_rgba(16,185,129,0.15)] hover:scale-102 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                        >
                          <span>SIGN UP</span>
                          <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Compact trust metrics */}
                  <div className="pt-6 border-t border-white/[0.05] grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xl font-black text-white font-display">100%</p>
                      <p className="text-[9px] text-slate-400 uppercase font-mono tracking-wider mt-0.5">Green Energy</p>
                    </div>
                    <div>
                      <p className="text-xl font-black text-emerald-400 font-display">99.98%</p>
                      <p className="text-[9px] text-slate-400 uppercase font-mono tracking-wider mt-0.5">Solar Uptime</p>
                    </div>
                    <div>
                      <p className="text-xl font-black text-white font-display">4 ms</p>
                      <p className="text-[9px] text-slate-400 uppercase font-mono tracking-wider mt-0.5">Backbone Ping</p>
                    </div>
                  </div>

                </div>

                {/* Right Half: VR Character & 3D floating icons and widgets */}
                <div className="lg:col-span-5 relative flex justify-center items-center h-[340px] sm:h-[450px]">
                  
                  {/* VR Character Image inside Glass Framing */}
                  <div className="relative p-2.5 rounded-[40px] bg-white/[0.02] border border-white/10 shadow-2xl z-20 overflow-hidden group transition-all duration-700 ease-out hover:scale-[1.04] hover:border-emerald-500/30 hover:shadow-[0_0_50px_rgba(16,185,129,0.25)] cursor-pointer">
                    {/* Glowing background aura that intensifies on hover */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/0 via-teal-500/0 to-cyan-500/0 opacity-0 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none z-5 rounded-[40px]" />
                    
                    {/* Security grid overlay on image */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(10,13,22,0.6)_100%)] pointer-events-none z-10 rounded-[30px]" />
                    
                    <img 
                      src={vrCharacterImg} 
                      alt="Stylized 3D character with VR Headset" 
                      referrerPolicy="no-referrer"
                      className="w-52 h-52 sm:w-68 sm:h-68 object-cover rounded-[30px] shadow-inner relative z-0 animate-float-slow transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                    />
                  </div>

                  {/* PLAYFUL 3D FLOATING ICONS & WIDGETS */}
                  {/* 1. 3D Credit Card (Pink/Purple Glassmorphic card floating top-left) */}
                  <div className="absolute top-2 -left-3 sm:-left-12 w-38 h-24 rounded-2xl border border-white/20 shadow-[0_15px_30px_rgba(0,0,0,0.4)] backdrop-blur-md bg-gradient-to-tr from-pink-500/25 via-purple-500/15 to-transparent p-3 flex flex-col justify-between text-white animate-float z-30 transition-transform duration-300 hover:scale-105 select-none font-mono">
                    <div className="flex justify-between items-start">
                      <span className="text-[7px] font-black tracking-widest text-pink-300 uppercase">KIJANI PAY</span>
                      <div className="w-5 h-4.5 rounded bg-amber-400/30 border border-amber-300/20" />
                    </div>
                    <div>
                      <p className="text-[9px] tracking-widest mb-1 font-bold">•••• •••• •••• 9240</p>
                      <div className="flex justify-between items-center text-[6px] text-pink-200">
                        <span>VAL 09/28</span>
                        <span className="font-sans font-extrabold text-[8px] text-pink-300">PLATINUM</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. 3D Calendar Card (Cyan/Blue Glassmorphic card floating bottom-left) */}
                  <div className="absolute bottom-12 -left-2 sm:-left-14 w-28 h-24 rounded-2xl border border-white/15 shadow-[0_15px_30px_rgba(0,0,0,0.4)] backdrop-blur-md bg-gradient-to-br from-cyan-500/20 via-blue-500/15 to-transparent p-3 flex flex-col text-white animate-float-reverse z-30 select-none">
                    <div className="bg-red-500/30 rounded-lg py-1 text-center border border-red-500/25 mb-1.5">
                      <span className="text-[7px] font-bold uppercase tracking-widest font-mono">CALENDAR</span>
                    </div>
                    <div className="text-center flex-1 flex flex-col justify-center">
                      <span className="text-2xl font-black tracking-tight leading-none text-cyan-200">14</span>
                      <span className="text-[7px] font-bold font-mono tracking-widest text-cyan-400 uppercase mt-0.5">JULY MON</span>
                    </div>
                  </div>

                  {/* 3. Live Uplink App Widget (Translucent, floating top-right) */}
                  <div className="absolute top-8 -right-3 sm:-right-10 rounded-2xl border border-white/15 shadow-[0_15px_30px_rgba(0,0,0,0.4)] backdrop-blur-md bg-slate-950/50 p-3 text-white flex flex-col gap-1 w-44 font-mono z-30 animate-float-slow select-none">
                    <div className="flex items-center gap-1.5 border-b border-white/[0.08] pb-1.5 mb-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[7px] font-black text-slate-400 tracking-wider uppercase">Live Uplink</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-[11px] font-bold text-emerald-400">▼ 1.25 Gbps</span>
                      <span className="text-[8px] text-slate-400 font-semibold">Symmetrical</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full" style={{ width: '85%' }} />
                    </div>
                  </div>

                  {/* 4. Analytics Chart App Widget (Translucent, floating bottom-right) */}
                  <div className="absolute bottom-10 -right-2 sm:-right-8 rounded-2xl border border-white/15 shadow-[0_15px_30px_rgba(0,0,0,0.4)] backdrop-blur-md bg-slate-950/60 p-3 text-white flex flex-col gap-2 w-36 font-mono z-30 animate-float select-none">
                    <div className="flex justify-between items-center">
                      <span className="text-[7px] font-black text-slate-400 uppercase tracking-wider">Metrics</span>
                      <TrendingUp className="w-3 h-3 text-cyan-400" />
                    </div>
                    {/* Visual mini bar chart columns */}
                    <div className="flex items-end justify-between h-8 px-1">
                      <div className="w-2 bg-emerald-500/40 rounded-t h-[40%]" />
                      <div className="w-2 bg-cyan-500/50 rounded-t h-[65%]" />
                      <div className="w-2 bg-blue-500/40 rounded-t h-[50%]" />
                      <div className="w-2 bg-indigo-500/30 rounded-t h-[30%]" />
                      <div className="w-2 bg-gradient-to-t from-emerald-500 to-cyan-400 rounded-t h-[90%] shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
                    </div>
                    <span className="text-[6px] text-slate-500 text-center uppercase tracking-widest font-bold">Workspace load</span>
                  </div>

                </div>

              </div>
            </div>

            {/* SECTION: FIBER PACKAGES GRID */}
            <div id="packages" className="backdrop-blur-2xl bg-white/[0.02] border border-white/[0.08] shadow-[0_32px_80px_rgba(0,0,0,0.55)] rounded-[40px] p-6 sm:p-8 lg:p-12 max-w-5xl w-full relative overflow-hidden transition-all duration-500">
              <div className="text-center max-w-xl mx-auto mb-10 space-y-1.5">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
                  SOLAR-POWERED HIGH SPEED PLANS
                </span>
                <h2 className="text-3xl font-black text-white tracking-tight font-display">
                  Enterprise Internet Subscriptions
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                  Uninterrupted bandwidth backed by localized battery microgrids. Choose the speed profile matching your work pipeline.
                </p>
              </div>

              {/* Glassmorphic Packages Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {INTERNET_PACKAGES.map((pkg) => {
                  const isGiga = pkg.id === 'kijani-giga';
                  return (
                    <div 
                      key={pkg.id}
                      className={`relative bg-white/[0.02] border rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 group shadow-lg ${
                        isGiga 
                          ? 'border-emerald-500/40 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent' 
                          : 'border-white/[0.06] hover:border-white/15'
                      }`}
                    >
                      {isGiga && (
                        <span className="absolute top-4 right-4 bg-emerald-500 text-slate-950 font-extrabold text-[8px] px-2.5 py-0.8 rounded-full uppercase tracking-wider font-mono">
                          POPULAR CHOICE
                        </span>
                      )}

                      <div className="space-y-4 text-left">
                        <div>
                          <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors font-display">
                            {pkg.name}
                          </h3>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">SOLAR BACKBONE FEED</p>
                        </div>

                        <div className="flex items-baseline gap-1 py-1.5 border-b border-white/[0.05]">
                          <span className="text-3xl font-black text-white font-display">{pkg.price}</span>
                          <span className="text-[10px] text-slate-400 font-mono">/ month</span>
                        </div>

                        <div className="space-y-2.5 pt-1">
                          {pkg.features.map((feat, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-300 leading-relaxed">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-6">
                        <button
                          onClick={() => handleOrderPackage(pkg.id)}
                          className={`w-full py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                            isGiga
                              ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                              : 'bg-white/[0.04] border border-white/[0.08] text-slate-200 hover:text-white hover:bg-white/[0.08]'
                          }`}
                        >
                          Order {pkg.speed} Plan
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION: LIVE NETWORK 3D MAP */}
            <div id="network" className="backdrop-blur-2xl bg-white/[0.02] border border-white/[0.08] shadow-[0_32px_80px_rgba(0,0,0,0.55)] rounded-[40px] p-6 sm:p-8 lg:p-10 max-w-5xl w-full relative overflow-hidden transition-all duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/[0.08] pb-4 mb-6 gap-4">
                <div className="text-left">
                  <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
                    GEOTHERMAL & SOLAR-MESH Handshake
                  </span>
                  <h2 className="text-2xl font-black text-white tracking-tight font-display">
                    Autonomous Backbone Topology
                  </h2>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono font-bold text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>8 Backbone Terminals Active</span>
                </div>
              </div>

              {/* Network3D Viewport inside Glass Container */}
              <div className="relative border border-white/[0.06] bg-slate-950/40 rounded-3xl overflow-hidden shadow-inner">
                <Network3D onHoverNode={setHoveredNode} />
              </div>
            </div>

            {/* SECTION: ECO IMPACT METRICS */}
            <div id="impact" className="backdrop-blur-2xl bg-white/[0.02] border border-white/[0.08] shadow-[0_32px_80px_rgba(0,0,0,0.55)] rounded-[40px] p-6 sm:p-8 lg:p-12 max-w-5xl w-full relative overflow-hidden transition-all duration-500 mb-12">
              <div className="text-center max-w-xl mx-auto mb-10 space-y-1.5">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
                  INDIGENOUS OFFSET & FORESTRY MONITOR
                </span>
                <h2 className="text-3xl font-black text-white tracking-tight font-display">
                  Eco-Impact Audit Engine
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                  A portion of each subscription funds community agroforestry nodes. Track our verified planetary dividend here.
                </p>
              </div>

              {/* Glassmorphic Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                
                <div className="space-y-6 text-left">
                  <h3 className="text-xl font-bold text-white font-display">
                    Renewable Localized Solar Relays
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Unlike legacy telecom nodes running continuous diesel backup generators, each Kijani Link terminal cabinet houses proprietary lithium solar banks providing full 48-hour autonomous grid offset.
                  </p>
                  <div className="space-y-3.5 pt-2 font-mono text-[10px]">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-slate-200"><span className="text-white font-bold">Nairobi Central:</span> 9 Core Nodes Carbon-Free</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-slate-200"><span className="text-white font-bold">Mombasa Oceanic:</span> Geothermal Feed Active</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-slate-200"><span className="text-white font-bold">Kisumu Mesh:</span> Grid Independence 100%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/[0.06] p-6 rounded-3xl text-left space-y-6 relative">
                  <div className="absolute top-4 right-4 text-emerald-400/5">
                    <Award className="w-16 h-16 stroke-1" />
                  </div>
                  <h4 className="font-bold text-sm text-white font-display">Ecological Dividends Ledger</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1.5 font-mono">
                        <span>Carbon Offsets (Metric Tons)</span>
                        <span className="font-bold text-emerald-400">85% Target</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.6)]" style={{ width: '85%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1.5 font-mono">
                        <span>Active Solar Sites Funded</span>
                        <span className="font-bold text-cyan-400">14 Stations</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.6)]" style={{ width: '65%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1.5 font-mono">
                        <span>Indigenous Seedlings Tracked</span>
                        <span className="font-bold text-teal-400">12,400+ Seedlings</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-400 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.6)]" style={{ width: '90%' }} />
                      </div>
                    </div>
                  </div>

                  <p className="text-[8px] text-slate-500 font-mono text-center pt-2">
                    LEAF Telemetry Verified • Quarter 3 2026 Audit
                  </p>
                </div>

              </div>
            </div>

            {/* SECTION: PRIORITY SUPPORT (GMAIL) */}
            <div id="email" className="backdrop-blur-2xl bg-white/[0.02] border border-white/[0.08] shadow-[0_32px_80px_rgba(0,0,0,0.55)] rounded-[40px] p-6 sm:p-8 lg:p-12 max-w-5xl w-full relative overflow-hidden transition-all duration-500 mb-12">
              <div className="text-center max-w-xl mx-auto mb-10 space-y-1.5">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
                  Priority Workspace Support
                </span>
                <h2 className="text-3xl font-black text-white tracking-tight font-display">
                  Connect & Send Queries
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                  Authenticate your Workspace email to send support messages directly from your inbox to our priority queue.
                </p>
              </div>

              {/* We will implement the Gmail form component here next */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-6 md:p-8 max-w-xl mx-auto w-full">
                 <GmailSupportForm />
              </div>
            </div>

          </div>

          {/* FLOATING 3D RAYCAST INTERACTION TOOLTIP OVERLAY (FOR NETWORK TABS) */}
          {hoveredNode && (
            <div 
              style={{ 
                position: 'fixed', 
                left: `${hoveredNode.x + 15}px`, 
                top: `${hoveredNode.y - 15}px`,
                pointerEvents: 'none',
                zIndex: 100
              }}
              className="backdrop-blur-xl bg-slate-950/85 border border-white/10 px-4 py-3 rounded-2xl shadow-2xl max-w-xs space-y-1 animate-in fade-in zoom-in-95 duration-150 text-left text-white"
            >
              <div className="flex items-center gap-2 border-b border-white/[0.08] pb-1.5 mb-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <h4 className="text-xs font-bold font-sans tracking-tight text-white">{hoveredNode.name}</h4>
              </div>
              <div className="text-[10px] font-mono text-slate-300 space-y-0.5">
                <p>• Category: <span className="text-emerald-400 font-bold">{hoveredNode.type}</span></p>
                <p>• Bandwidth: <span className="text-cyan-400 font-semibold">{hoveredNode.metric}</span></p>
                <p>• Status: <span className="text-emerald-400 font-bold">{hoveredNode.status}</span></p>
              </div>
            </div>
          )}

        </main>
      )}

      {/* PORTAL MODAL OVERLAY */}
      {portalMode && (
        <PortalModal 
          initialMode={portalMode} 
          onClose={handleClosePortal} 
          onLoginSuccess={handleLoginSuccess}
        />
      )}

    </div>
  );
}
