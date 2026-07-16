import React, { useState } from 'react';
import { Leaf, Wifi, ShieldAlert, User, Menu, X, ChevronDown } from 'lucide-react';

interface NavbarProps {
  onOpenPortal: (mode: 'subscriber' | 'admin') => void;
  onScrollToSection: (id: string) => void;
}

export default function Navbar({ onOpenPortal, onScrollToSection }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPortalDropdown, setShowPortalDropdown] = useState(false);

  const navItems = [
    { label: 'Home', id: 'home' },
    { label: 'Packages', id: 'packages' },
    { label: 'Coverage', id: 'coverage' },
    { label: 'About', id: 'about' }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <div 
            onClick={() => onScrollToSection('home')} 
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#10b981]/10 to-[#3b82f6]/5 border border-slate-200 group-hover:border-[#10b981]/40 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all duration-300">
              <Leaf className="w-5 h-5 text-[#10b981] absolute transition-transform group-hover:scale-110" />
              <Wifi className="w-6 h-6 text-[#10b981]/20 absolute" />
            </div>
            <div>
              <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent group-hover:from-emerald-500 group-hover:to-blue-500 transition-all duration-300">
                Kijani Link
              </span>
              <span className="block text-[8px] tracking-widest text-emerald-600 uppercase font-mono font-bold -mt-1">
                Eco-Light Speed
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onScrollToSection(item.id)}
                className="text-slate-600 hover:text-emerald-600 font-semibold text-sm transition-colors duration-200 cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Portal CTA with Dropdown */}
          <div className="hidden md:block relative">
            <button
              onClick={() => setShowPortalDropdown(!showPortalDropdown)}
              onBlur={() => setTimeout(() => setShowPortalDropdown(false), 200)}
              className="px-5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 hover:border-emerald-500 text-emerald-700 hover:bg-slate-50 font-semibold text-sm transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md"
            >
              <span>Access Portal</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showPortalDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showPortalDropdown && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 animate-in fade-in slide-in-from-top-3 duration-200">
                <button
                  onMouseDown={() => onOpenPortal('subscriber')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-emerald-700 text-left transition-all duration-150 cursor-pointer text-sm"
                >
                  <User className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-slate-800">Subscriber Portal</p>
                    <p className="text-[10px] text-slate-500">Manage account & active tests</p>
                  </div>
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button
                  onMouseDown={() => onOpenPortal('admin')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-emerald-50/50 text-slate-700 hover:text-emerald-700 text-left transition-all duration-150 cursor-pointer text-sm"
                >
                  <ShieldAlert className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-emerald-600">Admin Control Center</p>
                    <p className="text-[10px] text-slate-500">Activate lines & monitor nodes</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-600 hover:text-emerald-600 p-2"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-3 animate-in fade-in slide-in-from-top-5 duration-200">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onScrollToSection(item.id);
                setIsOpen(false);
              }}
              className="block w-full text-left text-slate-600 hover:text-emerald-600 py-2.5 px-3 rounded-lg hover:bg-emerald-50 font-medium transition-all"
            >
              {item.label}
            </button>
          ))}
          <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
            <button
              onClick={() => {
                onOpenPortal('subscriber');
                setIsOpen(false);
              }}
              className="flex items-center gap-3 w-full py-3 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold"
            >
              <User className="w-4 h-4 text-emerald-600" />
              Subscriber Portal
            </button>
            <button
              onClick={() => {
                onOpenPortal('admin');
                setIsOpen(false);
              }}
              className="flex items-center gap-3 w-full py-3 px-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-semibold"
            >
              <ShieldAlert className="w-4 h-4 text-emerald-600" />
              Admin Portal
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
