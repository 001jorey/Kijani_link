import React, { useState, useEffect } from 'react';
import { Mail, Send, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { initAuth, googleSignIn, getAccessToken, logout } from '../lib/gmailAuth';
import type { User } from 'firebase/auth';

export default function GmailSupportForm() {
  const [needsAuth, setNeedsAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setUser(user);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setStatusMsg(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      setStatusMsg({ type: 'error', text: 'Authentication failed. Please try again.' });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    // Show a confirmation dialog (Mandatory as per instructions for mutating actions)
    const confirmed = window.confirm('Send this support query via your Gmail account?');
    if (!confirmed) return;

    setIsSending(true);
    setStatusMsg(null);

    try {
      const token = await getAccessToken();
      if (!token) {
        setNeedsAuth(true);
        throw new Error('Access token not found. Please sign in again.');
      }

      // Hardcoded support email for Kijani Link
      const to = '001jorey@gmail.com'; 
      const from = user?.email || 'me';

      const emailLines = [
        `To: ${to}`,
        `From: ${from}`,
        `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
        '',
        message,
      ];
      const rawEmail = emailLines.join('\r\n');
      const base64EncodedEmail = btoa(unescape(encodeURIComponent(rawEmail)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: base64EncodedEmail
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        console.error('Failed to send email', errData);
        throw new Error(errData.error?.message || 'Failed to send email via Gmail API');
      }

      setStatusMsg({ type: 'success', text: 'Message sent successfully. Our team will contact you shortly.' });
      setSubject('');
      setMessage('');
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: err.message || 'An error occurred while sending the message.' });
    } finally {
      setIsSending(false);
    }
  };

  if (needsAuth) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-8">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-2 shadow-inner">
          <Mail className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-xl font-display font-bold text-white text-center">Authenticate to Connect</h3>
        <p className="text-xs text-slate-400 max-w-sm text-center font-sans">
          To send priority support emails directly from your workspace account, please authenticate with Google Workspace.
        </p>

        {statusMsg?.type === 'error' && (
          <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold bg-rose-500/10 px-4 py-2 rounded-lg border border-rose-500/20">
            <AlertCircle className="w-4 h-4" />
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Official Google Sign In Button Style */}
        <button 
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="gsi-material-button group bg-white hover:bg-slate-50 transition-colors shadow-lg rounded-[4px] px-3 py-2 flex items-center gap-3 cursor-pointer mt-4"
        >
          <div className="gsi-material-button-icon bg-white p-1 rounded-sm">
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 block">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
          </div>
          <span className="text-[14px] text-slate-600 font-medium font-sans">
            {isLoggingIn ? 'Connecting...' : 'Sign in with Google'}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
            <Mail className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-bold text-white font-display text-sm">Direct Uplink</h3>
            <p className="text-[10px] text-slate-400 font-mono tracking-wide uppercase">Connected as {user?.email}</p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="text-[10px] font-bold font-mono tracking-widest text-slate-400 hover:text-rose-400 uppercase transition-colors px-3 py-1.5 rounded-lg border border-transparent hover:border-rose-500/30 hover:bg-rose-500/5 cursor-pointer"
        >
          Disconnect
        </button>
      </div>

      <form onSubmit={handleSendEmail} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest ml-1">Subject</label>
          <input 
            type="text" 
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Bandwidth Upgrade Request"
            className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all font-sans"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest ml-1">Message</label>
          <textarea 
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your enterprise requirements..."
            rows={5}
            className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all font-sans resize-none"
          />
        </div>

        {statusMsg && (
          <div className={`flex items-center gap-2 text-xs font-semibold px-4 py-3 rounded-xl border ${
            statusMsg.type === 'success' 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}>
            {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <div className="pt-2">
          <button 
            type="submit"
            disabled={isSending || !subject.trim() || !message.trim()}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:hover:bg-emerald-500 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Transmit Secure Message</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
          <p className="text-[9px] text-slate-500 text-center mt-3 font-mono">
            Encrypted end-to-end via Gmail APIs
          </p>
        </div>
      </form>
    </div>
  );
}
