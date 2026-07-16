import React, { useState, useEffect, useRef } from 'react';
import { 
  Wifi, Zap, Activity, CreditCard, Download, Upload, 
  MapPin, CheckCircle2, AlertTriangle, Play, RefreshCw, Cpu,
  Leaf, LogOut, Menu, X
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';
import { Subscriber, SpeedTestResult } from '../types';
import { INTERNET_PACKAGES } from '../data/packages';
import { saveSpeedTest, payInvoice } from '../data/store';

interface SubscriberDashboardProps {
  subscriber: Subscriber;
  onLogout: () => void;
  onRefreshSubscriber: (id: string) => void;
}

export default function SubscriberDashboard({ subscriber, onLogout, onRefreshSubscriber }: SubscriberDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'speedtest' | 'billing'>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [speedTesting, setSpeedTesting] = useState(false);
  const [testPhase, setTestPhase] = useState<'idle' | 'ping' | 'download' | 'upload' | 'completed'>('idle');
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [pingVal, setPingVal] = useState(0);
  const [downloadVal, setDownloadVal] = useState(0);
  const [uploadVal, setUploadVal] = useState(0);
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
  const [testProgress, setTestProgress] = useState(0); // 0 to 5 seconds scale

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const activePackage = INTERNET_PACKAGES.find(p => p.id === subscriber.packageId) || INTERNET_PACKAGES[0];

  // Map package limit to cap mock speed test
  const getSpeedCap = () => {
    if (subscriber.packageId === 'kijani-eco') return 50;
    if (subscriber.packageId === 'kijani-turbo') return 200;
    return 1000;
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Run Animated Speed Test (Exactly 5.0 seconds duration)
  const startSpeedTest = () => {
    if (speedTesting) return;
    setSpeedTesting(true);
    setTestPhase('ping');
    setPingVal(0);
    setDownloadVal(0);
    setUploadVal(0);
    setCurrentSpeed(0);
    setTestProgress(0);

    const speedCap = getSpeedCap();
    const startTime = Date.now();
    const duration = 5000; // 5000ms = 5 seconds

    // Pre-calculate realistic final values based on the active connection
    const finalPing = Math.floor(4 + Math.random() * 8); // 4ms to 11ms latency
    const finalDownload = Math.round(speedCap * (0.90 + Math.random() * 0.08)); // 90-98% of package cap
    const finalUpload = Math.round(finalDownload * (0.85 + Math.random() * 0.10)); // 85-95% of download (high fiber symmetry)

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      setTestProgress(progress * 5); // From 0.0 to 5.0 seconds

      if (progress < 0.2) {
        // --- PING PHASE (0s to 1.0s) ---
        setTestPhase('ping');
        // Fluctuate ping latency dynamically
        const tempPing = Math.floor(3 + Math.random() * 15);
        setPingVal(tempPing);
        setCurrentSpeed(0);
      } else if (progress < 0.6) {
        // --- DOWNLOAD PHASE (1.0s to 3.0s) ---
        if (testPhase !== 'download') {
          setPingVal(finalPing); // Lock final ping latency
          setTestPhase('download');
        }
        
        // Quad ease-out ramp-up from 0 to final download speed
        const dlProgress = (progress - 0.2) / 0.4; // 0.0 to 1.0
        const targetDl = finalDownload * (1 - Math.pow(1 - dlProgress, 2));
        const jitter = Math.random() * (speedCap * 0.04) - (speedCap * 0.02);
        const dynamicDl = Math.max(1, Math.round(targetDl + jitter));
        
        setCurrentSpeed(dynamicDl);
        setDownloadVal(dynamicDl);
      } else if (progress < 1.0) {
        // --- UPLOAD PHASE (3.0s to 5.0s) ---
        if (testPhase !== 'upload') {
          setDownloadVal(finalDownload); // Lock final download speed
          setTestPhase('upload');
        }
        
        // Quad ease-out ramp-up from 0 to final upload speed
        const ulProgress = (progress - 0.6) / 0.4; // 0.0 to 1.0
        const targetUl = finalUpload * (1 - Math.pow(1 - ulProgress, 2));
        const jitter = Math.random() * (finalUpload * 0.04) - (finalUpload * 0.02);
        const dynamicUl = Math.max(1, Math.round(targetUl + jitter));
        
        setCurrentSpeed(dynamicUl);
        setUploadVal(dynamicUl);
      } else {
        // --- COMPLETE (5.0s exactly) ---
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        
        setPingVal(finalPing);
        setDownloadVal(finalDownload);
        setUploadVal(finalUpload);
        setCurrentSpeed(0);
        setTestPhase('completed');
        setSpeedTesting(false);
        setTestProgress(5);

        // Save benchmark parameters into storage
        const testResult: SpeedTestResult = {
          download: finalDownload,
          upload: finalUpload,
          ping: finalPing,
          timestamp: new Date().toISOString()
        };
        saveSpeedTest(subscriber.id, testResult);
        onRefreshSubscriber(subscriber.id);
      }
    }, 50); // Fast 50ms tick rate for smooth speedometer movement
  };

  // Pay outstanding invoice
  const handlePayInvoice = (invoiceId: string) => {
    setPayingInvoiceId(invoiceId);
    setTimeout(() => {
      payInvoice(subscriber.id, invoiceId);
      onRefreshSubscriber(subscriber.id);
      setPayingInvoiceId(null);
    }, 1500);
  };

  // Format historical chart data
  const chartData = [
    { month: 'Feb', usage: subscriber.monthlyUsageGB[0] || 110 },
    { month: 'Mar', usage: subscriber.monthlyUsageGB[1] || 140 },
    { month: 'Apr', usage: subscriber.monthlyUsageGB[2] || 135 },
    { month: 'May', usage: subscriber.monthlyUsageGB[3] || 160 },
    { month: 'Jun', usage: subscriber.monthlyUsageGB[4] || 155 },
    { month: 'Jul (Current)', usage: subscriber.monthlyUsageGB[5] || 185 },
  ];

  return (
    <div className="bg-[#060814] text-slate-100 min-h-screen relative overflow-hidden font-sans flex flex-col lg:flex-row w-full antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* Deep Perspective Background Grid & Glowing 3D Spheres */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:48px_48px] opacity-25 pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03)_0%,transparent_80%)] pointer-events-none" />

      {/* Ambient background orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-20 left-1/3 w-80 h-80 rounded-full bg-pink-500/5 blur-[80px] pointer-events-none" />

      {/* Desktop Sidebar (Left) */}
      <aside className="hidden lg:flex fixed left-6 top-6 bottom-6 w-64 z-40 rounded-3xl backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] p-6 flex-col justify-between overflow-y-auto">
        <div className="space-y-8">
          {/* Sidebar Logo */}
          <div className="flex items-center gap-3 border-b border-white/[0.06] pb-5">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/10 border border-white/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <Leaf className="w-5 h-5 text-emerald-400" />
              <Wifi className="w-5 h-5 text-emerald-400/20 absolute animate-pulse" />
            </div>
            <div>
              <h2 className="font-display font-black text-sm tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Kijani Link
              </h2>
              <span className="block text-[8px] tracking-widest text-emerald-400 uppercase font-mono font-bold -mt-0.5">
                CLIENT PORTAL
              </span>
            </div>
          </div>

          {/* Navigation Tabs List */}
          <nav className="space-y-2">
            {[
              { id: 'overview', label: 'Dashboard Overview', icon: Cpu },
              { id: 'speedtest', label: 'Light-Speed Test', icon: Activity },
              { id: 'billing', label: 'Billing & Invoices', icon: CreditCard },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-semibold text-xs border text-left cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500/15 to-blue-500/10 border-emerald-500/40 text-emerald-400 shadow-[0_8px_20px_rgba(16,185,129,0.1)]'
                      : 'bg-transparent border-transparent text-slate-400 hover:text-slate-100 hover:bg-white/[0.02]'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'scale-110 text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Foot */}
        <div className="space-y-4 pt-6 border-t border-white/[0.06]">
          <div className="px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
            <p className="text-[10px] text-slate-500 font-mono">CONNECTED TO</p>
            <p className="text-[11px] text-emerald-400 font-bold truncate">Solar-Core-Nairobi</p>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="lg:hidden fixed top-4 left-4 right-4 h-16 rounded-2xl backdrop-blur-xl bg-slate-950/40 border border-white/10 flex items-center justify-between px-4 z-40 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/20 border border-white/10">
            <Leaf className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="font-display font-black text-sm tracking-tight text-white">
            Kijani Portal
          </span>
        </div>
        
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-300 hover:text-white transition-colors"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Menu Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-slate-950/90 backdrop-blur-md pt-24 px-6 space-y-6">
          <nav className="space-y-3">
            {[
              { id: 'overview', label: 'Dashboard Overview', icon: Cpu },
              { id: 'speedtest', label: 'Light-Speed Test', icon: Activity },
              { id: 'billing', label: 'Billing & Invoices', icon: CreditCard },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 font-semibold text-sm border text-left ${
                    isActive
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                      : 'bg-transparent border-transparent text-slate-400'
                  }`}
                >
                  <Icon className="w-5 h-5 text-emerald-400" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
          
          <div className="pt-6 border-t border-white/10">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLogout();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        </div>
      )}

      {/* Main Scrollable Content */}
      <main className="flex-1 lg:ml-72 p-4 sm:p-6 lg:p-8 pt-24 lg:pt-8 z-10 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* Portal Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-white/[0.06] pb-6">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] tracking-wider font-bold uppercase shadow-sm">
                Active Client Portal
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono bg-white/[0.03] px-2.5 py-1 rounded border border-white/[0.06]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                IP Address: 102.168.4.{Math.floor(10 + Math.random() * 89)}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mt-2 font-display">
              Welcome back, {subscriber.name}
            </h1>
            <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              Service address: <span className="font-medium text-slate-200">{subscriber.address}</span>
            </p>
          </div>
        </div>

        {/* Top summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Package Info Card */}
          <div className="backdrop-blur-md bg-white/[0.02] border border-white/[0.08] p-6 rounded-2xl flex items-start gap-4 shadow-xl hover:bg-white/[0.04] transition-all">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-mono">Your Connection Tier</p>
              <h3 className="font-bold text-lg text-white mt-0.5 font-display">{activePackage.name}</h3>
              <p className="text-2xl font-black text-emerald-400 mt-1 font-display">
                {activePackage.price}<span className="text-xs font-medium text-slate-500">/mo</span>
              </p>
            </div>
          </div>

          {/* Line Status Card */}
          <div className="backdrop-blur-md bg-white/[0.02] border border-white/[0.08] p-6 rounded-2xl flex items-start gap-4 shadow-xl hover:bg-white/[0.04] transition-all">
            <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl text-teal-400">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-mono">Active Link Status</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-bold text-sm text-emerald-400">Fiber Line Fully Active</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Routed through <span className="text-slate-200 font-semibold font-mono">Solar-Core-Nairobi</span>
              </p>
            </div>
          </div>

          {/* Current Period Usage */}
          <div className="backdrop-blur-md bg-white/[0.02] border border-white/[0.08] p-6 rounded-2xl flex items-start gap-4 shadow-xl hover:bg-white/[0.04] transition-all">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-mono">Monthly Solar-Data Usage</p>
              <h3 className="font-black text-2xl text-white mt-1 font-display">
                {subscriber.monthlyUsageGB[5] || 185} <span className="text-xs font-medium text-slate-400 font-sans">GB</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Unlimited data plan (No throttling active)
              </p>
            </div>
          </div>

        </div>

        {/* Content Tabs */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart Column (2/3 width) */}
            <div className="lg:col-span-2 bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl p-6 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-lg text-white font-display">Historical Green Data Flow</h3>
                  <p className="text-xs text-slate-400">6-month subscriber bandwidth consumption in Gigabytes</p>
                </div>
                <div className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20 font-bold">
                  Carbon Free Network
                </div>
              </div>

              {/* Chart */}
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="usageGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(10,15,30,0.95)', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', color: '#fff' }}
                      labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                      itemStyle={{ color: '#34d399' }}
                    />
                    <Area type="monotone" dataKey="usage" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#usageGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Router Status Details Column (1/3 width) */}
            <div className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl p-6 rounded-2xl flex flex-col justify-between shadow-xl">
              <div>
                <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2 font-display">
                  <Cpu className="w-5 h-5 text-emerald-400" />
                  Smart Router Gateway
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-white/[0.04] pb-3">
                    <span className="text-xs text-slate-400">Device Model</span>
                    <span className="text-xs text-slate-200 font-mono font-semibold">Kijani GigaRouter v6.2</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/[0.04] pb-3">
                    <span className="text-xs text-slate-400">Wi-Fi Channels</span>
                    <span className="text-xs text-slate-200 font-mono font-semibold">2.4G / 5G / 6G (Eco-Active)</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/[0.04] pb-3">
                    <span className="text-xs text-slate-400">LAN Status</span>
                    <span className="text-xs text-slate-200 font-semibold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      4 active Ethernet links
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Solar Backup Power</span>
                    <span className="text-xs text-emerald-400 font-mono font-bold flex items-center gap-1">
                      100% Sourced Solar
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/[0.04] bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
                <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                  🌱 <span className="text-emerald-400 font-semibold">Eco-Contribution:</span> Your home terminal offset <span className="text-emerald-400 font-bold">14.8 kg CO2e</span> last month through Kijani's solar-powered backbone.
                </p>
              </div>
            </div>

            {/* Last Speed Test Result Banner */}
            <div className="lg:col-span-3 bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                  <Activity className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-white font-display text-sm">Last Diagnostics Speed Benchmark</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {subscriber.currentSpeedTest 
                      ? `Timestamp: ${new Date(subscriber.currentSpeedTest.timestamp).toLocaleString()}` 
                      : 'No benchmark run yet for this cycle.'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-[10px] text-slate-400 uppercase font-mono">Download</p>
                  <p className="text-xl font-extrabold text-emerald-400 font-display">
                    {subscriber.currentSpeedTest ? `${subscriber.currentSpeedTest.download} Mbps` : '--'}
                  </p>
                </div>
                <div className="h-8 w-px bg-white/[0.08]" />
                <div className="text-center">
                  <p className="text-[10px] text-slate-400 uppercase font-mono">Upload</p>
                  <p className="text-xl font-extrabold text-cyan-400 font-display">
                    {subscriber.currentSpeedTest ? `${subscriber.currentSpeedTest.upload} Mbps` : '--'}
                  </p>
                </div>
                <div className="h-8 w-px bg-white/[0.08]" />
                <div className="text-center">
                  <p className="text-[10px] text-slate-400 uppercase font-mono">Ping</p>
                  <p className="text-xl font-extrabold text-slate-200 font-display">
                    {subscriber.currentSpeedTest ? `${subscriber.currentSpeedTest.ping} ms` : '--'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('speedtest')}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-[#060814] font-black rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-500/10"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Run Diagnostics Test
              </button>
            </div>

          </div>
        )}

        {/* Speed Test Tab */}
        {activeTab === 'speedtest' && (
          <div className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl p-8 rounded-3xl max-w-2xl mx-auto shadow-xl">
            <div className="text-center mb-6">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px] uppercase font-bold tracking-wider">
                Kijani Net-Meter
              </span>
              <h3 className="text-xl font-bold text-white mt-2 font-display">Light-Speed Diagnostics</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Accurately test download bandwidth, packet latency, and upload speed back to our solar-backed spine.
              </p>
            </div>

            {/* Overall 5-second Test Progress Indicator */}
            <div className="mb-8">
              <div className="flex justify-between items-center text-xs text-slate-400 font-mono mb-2">
                <span>
                  {speedTesting ? (
                    <span className="text-emerald-400 flex items-center gap-1.5 font-sans font-semibold">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                      {testPhase === 'ping' && 'Measuring ping packet trip latency...'}
                      {testPhase === 'download' && 'Downloading high bandwidth fragments...'}
                      {testPhase === 'upload' && 'Measuring packet upstream symmetry...'}
                    </span>
                  ) : testPhase === 'completed' ? (
                    <span className="text-emerald-400 font-sans font-semibold">✓ Speed test complete</span>
                  ) : (
                    <span>Ready for network check</span>
                  )}
                </span>
                <span>
                  {speedTesting ? (
                    <span>Remaining: <strong className="text-slate-200">{(5.0 - testProgress).toFixed(1)}s</strong></span>
                  ) : testPhase === 'completed' ? (
                    <span>Duration: <strong>5.0s</strong></span>
                  ) : (
                    <span>Awaiting start</span>
                  )}
                </span>
              </div>
              <div className="w-full bg-white/[0.04] h-2.5 rounded-full overflow-hidden border border-white/[0.08] relative">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 transition-all duration-75 ease-out rounded-full"
                  style={{ width: `${(testProgress / 5) * 100}%` }}
                />
              </div>
            </div>

            {/* Interactive Speed Gauge Circle */}
            <div className="relative w-64 h-64 mx-auto mb-8 flex flex-col items-center justify-center">
              
              {/* Outer Ring */}
              <div className="absolute inset-0 rounded-full border-4 border-white/[0.04] flex items-center justify-center">
                <div className={`absolute inset-1 rounded-full border-2 border-emerald-500/5 transition-all duration-300 ${speedTesting ? 'animate-pulse border-emerald-500/20' : ''}`} />
              </div>

              {/* Dynamic Progress Circular Line using SVG */}
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="116"
                  stroke={testPhase === 'completed' ? '#10b981' : testPhase === 'upload' ? '#06b6d4' : '#10b981'}
                  strokeWidth="6"
                  strokeLinecap="round"
                  fill="transparent"
                  strokeDasharray="728"
                  strokeDashoffset={
                    728 - (728 * (
                      testPhase === 'ping' 
                        ? (pingVal > 0 ? 15 : 5) 
                        : testPhase === 'idle' 
                          ? 0 
                          : Math.min(100, (currentSpeed / getSpeedCap()) * 100)
                    )) / 100
                  }
                  className="transition-all duration-100 ease-out"
                />
              </svg>

              {/* Centered Speed Metrics */}
              <div className="text-center z-10 px-4 select-none">
                <p className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-widest">
                  {testPhase === 'idle' && 'READY'}
                  {testPhase === 'ping' && 'LATENCY'}
                  {testPhase === 'download' && 'DOWNLOAD'}
                  {testPhase === 'upload' && 'UPLOAD'}
                  {testPhase === 'completed' && 'FINISHED'}
                </p>
                
                {/* Large animated counter text */}
                <h2 className="text-5xl font-black text-white mt-1 font-display tracking-tight transition-transform duration-75">
                  {testPhase === 'ping' ? pingVal : currentSpeed}
                </h2>
                
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono mt-0.5">
                  {testPhase === 'ping' ? 'MS Latency' : 'Mbps Rate'}
                </p>
              </div>

              {/* Flowing animated light particles */}
              {speedTesting && (
                <div className="absolute inset-0 animate-spin" style={{ animationDuration: testPhase === 'download' ? '0.8s' : '1.5s' }}>
                  <div className="w-3 h-3 bg-emerald-400 rounded-full absolute top-0 left-1/2 -ml-1.5 shadow-[0_0_8px_#10b981]" />
                </div>
              )}
            </div>

            {/* Test Readouts with custom individual status highlights */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {/* PING CARD */}
              <div className={`p-4 rounded-2xl border transition-all duration-300 text-center relative overflow-hidden ${
                testPhase === 'ping'
                  ? 'bg-emerald-500/10 border-emerald-500/40 scale-[1.03]'
                  : 'bg-white/[0.02] border-white/[0.04]'
              }`}>
                {testPhase === 'ping' && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[#10b981] animate-pulse" />
                )}
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Ping Latency</p>
                <p className={`text-lg font-bold mt-1 font-display transition-colors ${
                  testPhase === 'ping' ? 'text-emerald-400 animate-pulse' : 'text-white'
                }`}>
                  {pingVal ? `${pingVal} ms` : '--'}
                </p>
                <div className="text-[9px] font-mono mt-1 text-slate-400">
                  {testPhase === 'ping' ? (
                    <span className="text-emerald-400 animate-pulse font-bold">● Running</span>
                  ) : pingVal ? (
                    <span className="text-emerald-400 font-semibold">✓ Logged</span>
                  ) : (
                    <span>Pending</span>
                  )}
                </div>
              </div>

              {/* DOWNLOAD CARD */}
              <div className={`p-4 rounded-2xl border transition-all duration-300 text-center relative overflow-hidden ${
                testPhase === 'download'
                  ? 'bg-emerald-500/10 border-emerald-500/40 scale-[1.03]'
                  : 'bg-white/[0.02] border-white/[0.04]'
              }`}>
                {testPhase === 'download' && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[#10b981] animate-pulse" />
                )}
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Download</p>
                <p className={`text-lg font-bold mt-1 font-display transition-colors ${
                  testPhase === 'download' ? 'text-emerald-400 animate-pulse' : 'text-white'
                }`}>
                  {downloadVal ? `${downloadVal} Mbps` : '--'}
                </p>
                <div className="text-[9px] font-mono mt-1 text-slate-400">
                  {testPhase === 'download' ? (
                    <span className="text-emerald-400 animate-pulse font-bold">● Running</span>
                  ) : downloadVal ? (
                    <span className="text-emerald-400 font-semibold">✓ Logged</span>
                  ) : (
                    <span>Pending</span>
                  )}
                </div>
              </div>

              {/* UPLOAD CARD */}
              <div className={`p-4 rounded-2xl border transition-all duration-300 text-center relative overflow-hidden ${
                testPhase === 'upload'
                  ? 'bg-emerald-500/10 border-emerald-500/40 scale-[1.03]'
                  : 'bg-white/[0.02] border-white/[0.04]'
              }`}>
                {testPhase === 'upload' && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[#10b981] animate-pulse" />
                )}
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Upload</p>
                <p className={`text-lg font-bold mt-1 font-display transition-colors ${
                  testPhase === 'upload' ? 'text-emerald-400 animate-pulse' : 'text-white'
                }`}>
                  {uploadVal ? `${uploadVal} Mbps` : '--'}
                </p>
                <div className="text-[9px] font-mono mt-1 text-slate-400">
                  {testPhase === 'upload' ? (
                    <span className="text-emerald-400 animate-pulse font-bold">● Running</span>
                  ) : uploadVal ? (
                    <span className="text-emerald-400 font-semibold">✓ Logged</span>
                  ) : (
                    <span>Pending</span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-center">
              <button
                onClick={startSpeedTest}
                disabled={speedTesting}
                className={`px-8 py-3.5 rounded-2xl font-bold cursor-pointer transition-all flex items-center gap-2 ${
                  speedTesting 
                    ? 'bg-white/[0.04] text-slate-500 border border-white/[0.08] cursor-not-allowed shadow-none' 
                    : 'bg-emerald-500 hover:bg-emerald-400 text-[#060814] font-black shadow-lg shadow-emerald-500/10'
                }`}
              >
                {speedTesting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-slate-500" />
                    Measuring Bandwidth...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    {testPhase === 'completed' ? 'Run Diagnostics Again' : 'Start Speed Test'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <div className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h3 className="text-xl font-bold text-white font-display">Billing History & Invoices</h3>
                <p className="text-xs text-slate-400 mt-0.5">Secure carbon-free invoicing and payment simulator</p>
              </div>
              
              <div className="bg-emerald-500/5 border border-emerald-500/10 px-4 py-2.5 rounded-xl flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="text-left">
                  <p className="text-[10px] text-slate-400 font-mono">Current Payment Method</p>
                  <p className="text-xs font-semibold text-slate-200">Linked Visa Ending ****8492</p>
                </div>
              </div>
            </div>

            {/* Invoices List */}
            <div className="overflow-hidden border border-white/[0.08] rounded-2xl bg-white/[0.01]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/[0.08]">
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase font-mono">Invoice ID</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase font-mono">Billing Date</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase font-mono">Amount Sourced</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase font-mono">Status</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase font-mono text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {subscriber.billingHistory.map((invoice) => (
                    <tr key={invoice.invoiceId} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 font-semibold font-mono text-sm text-slate-200">
                        {invoice.invoiceId}
                      </td>
                      <td className="p-4 text-xs text-slate-400">
                        {invoice.date}
                      </td>
                      <td className="p-4 text-sm font-semibold text-white font-display">
                        KSh {invoice.amount.toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          invoice.status === 'paid' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${invoice.status === 'paid' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                          {invoice.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {invoice.status === 'pending' ? (
                          <button
                            onClick={() => handlePayInvoice(invoice.invoiceId)}
                            disabled={payingInvoiceId === invoice.invoiceId}
                            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#060814] font-black text-xs transition-all cursor-pointer flex items-center gap-1 ml-auto shadow-md"
                          >
                            {payingInvoiceId === invoice.invoiceId ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#060814]" />
                                Processing...
                              </>
                            ) : (
                              'Pay Bill'
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500 font-medium italic">Invoice Paid</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Carbon Offset Certificate Promo */}
            <div className="mt-8 bg-gradient-to-r from-emerald-500/5 to-blue-500/5 border border-white/[0.08] rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-left">
                <h4 className="font-bold text-white font-display text-sm">Your Certified Green Impact</h4>
                <p className="text-xs text-slate-400 mt-1">
                  By utilizing Kijani's direct solar-powered routing, your account offset <span className="text-emerald-400 font-bold">14.8 kg CO2e</span> last cycle!
                </p>
              </div>
              <button className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold rounded-xl text-slate-200 transition-all cursor-pointer shadow-sm">
                Download Impact Certificate
              </button>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
