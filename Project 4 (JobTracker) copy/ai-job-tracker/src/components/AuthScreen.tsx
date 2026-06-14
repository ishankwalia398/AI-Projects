import React, { useState } from 'react';
import { dbGetUser, dbCreateUser } from '../lib/db';
import { User } from '../types';
import { Briefcase, Lock, User as UserIcon, Mail, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
}

export function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!username.trim()) {
      setError('Please provide a valid username');
      setLoading(false);
      return;
    }

    try {
      if (isRegister) {
        if (!email.trim() || !fullName.trim()) {
          setError('Email and Full Name are required');
          setLoading(false);
          return;
        }
        // Write account to DB
        await dbCreateUser(username, email, fullName);
        setSuccess('Registration successful! You can now log into your profile.');
        setIsRegister(false);
        // Clear fields
        setEmail('');
        setFullName('');
      } else {
        const user = await dbGetUser(username);
        if (user) {
          onLoginSuccess(user);
        } else {
          setError('Username not found. Please register a new account!');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50 font-sans" id="auth-screen">
      {/* Visual panel (Desktop logo and intro card) */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-linear-to-b from-slate-900 to-slate-950 text-white relative overflow-hidden">
        {/* Subtle glowing mesh backgrounds */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl"></div>

        <div className="flex items-center gap-3 z-10">
          <div className="p-2 bg-emerald-500 rounded-lg text-slate-950 shadow-md">
            <Briefcase className="h-6 w-6 stroke-[2.5]" />
          </div>
          <span className="font-sans font-bold text-xl tracking-tight">AIJobtracker<span className="text-emerald-400">.</span></span>
        </div>

        <div className="space-y-6 max-w-lg z-10 my-auto">
          <h1 className="text-4xl font-extrabold tracking-tight leading-none text-slate-100">
            A secure, AI-powered command center for your career climb.
          </h1>
          <p className="text-slate-300 text-base leading-relaxed">
            Manage your applications pipeline asynchronously with a highly modular Kanban interface, interactive calendar schedulers, custom cover letter scripts, and recruiter intelligence.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div>
              <div className="font-mono text-emerald-400 text-lg font-bold">100% Secure</div>
              <div className="text-slate-400 text-xs">Isolated local client-side IndexedDB databases</div>
            </div>
            <div>
              <div className="font-mono text-cyan-400 text-lg font-bold">Smart Insights</div>
              <div className="text-slate-400 text-xs">Interactive ATS matches fueled by Gemini</div>
            </div>
          </div>
        </div>

        <div className="text-slate-500 text-xs z-10 flex justify-between">
          <span>AIJobtracker © 2026</span>
          <span>Google AI Studio Build</span>
        </div>
      </div>

      {/* Auth form panel */}
      <div className="flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md space-y-8 bg-white p-8 sm:p-10 rounded-2xl border border-slate-100 shadow-xs">
          <div className="space-y-3 text-center lg:text-left">
            {/* Logo for mobile */}
            <div className="flex justify-center lg:hidden gap-2 items-center mb-4">
              <div className="p-2 bg-emerald-500 rounded-lg text-white">
                <Briefcase className="h-5 w-5" />
              </div>
              <span className="font-sans font-bold text-lg text-slate-900">AIJobtracker</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {isRegister ? 'Create your profile' : 'Sign in to tracker'}
            </h2>
            <p className="text-slate-500 text-sm">
              {isRegister 
                ? 'Register a secure username to isolate your application pipeline.' 
                : 'Enter your registered username to unlock your personalized command center.'}
            </p>
          </div>

          {/* Success / Error Banners */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg flex gap-3 text-xs items-start leading-relaxed animate-fade-in">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg flex gap-3 text-xs items-start leading-relaxed animate-fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
              <div>{success}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Secure Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <UserIcon className="h-4 w-4" />
                </span>
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. john_doe"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white focus:ring-1 focus:ring-slate-400 rounded-lg text-sm text-slate-900 font-medium transition-all outline-hidden"
                />
              </div>
            </div>

            {isRegister && (
              <>
                <div>
                  <label htmlFor="fullName" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <UserIcon className="h-4 w-4" />
                    </span>
                    <input
                      id="fullName"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white focus:ring-1 focus:ring-slate-400 rounded-lg text-sm text-slate-900 transition-all outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. john@example.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white focus:ring-1 focus:ring-slate-400 rounded-lg text-sm text-slate-900 transition-all outline-hidden"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-lg transition-colors cursor-pointer shadow-xs active:bg-slate-950 flex justify-center items-center gap-2 disabled:opacity-55 disabled:cursor-not-allowed mt-6"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  {isRegister ? 'Register Secure Profile' : 'Authenticate Session'}
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
                setSuccess(null);
              }}
              className="text-xs text-slate-500 hover:text-slate-900 transition-colors font-semibold underline underline-offset-4"
            >
              {isRegister ? 'Already have a secure username? Log In' : 'Create a new secure username profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
