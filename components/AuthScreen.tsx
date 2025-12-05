
import React, { useState } from 'react';
import { Lock, Mail, User, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import Header from './Header';

interface AuthScreenProps {
  onLogin: (user: { name: string; email: string }) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Simulate API call and DB check
    setTimeout(() => {
      try {
        const usersDb = JSON.parse(localStorage.getItem('mommy_users_db') || '[]');
        
        if (isLogin) {
            // Login Logic
            const foundUser = usersDb.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
            if (foundUser) {
                onLogin({ name: foundUser.name, email: foundUser.email });
            } else {
                // For demo purposes, if the DB is empty, let the first login pass as 'Prasanjit' to not break legacy flow,
                // OR strictly fail. Let's be strict for "multiple user accessing" feature.
                // But as a fallback for existing demo users, if DB is empty, maybe auto-create? 
                // No, let's force signup if user doesn't exist.
                setError("Invalid email or password");
                setIsLoading(false);
            }
        } else {
            // Signup Logic
            if (usersDb.find((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
                setError("User with this email already exists");
                setIsLoading(false);
                return;
            }
            const newUser = { name, email, password };
            usersDb.push(newUser);
            localStorage.setItem('mommy_users_db', JSON.stringify(usersDb));
            onLogin({ name, email });
        }
      } catch (err) {
        setError("System error. Please clear cache.");
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 relative z-50 overflow-hidden font-sans">
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] bg-pink-600/20 rounded-full blur-[120px] mix-blend-screen" />
         <div className="absolute bottom-[0%] right-[0%] w-[40vw] h-[40vw] bg-purple-600/20 rounded-full blur-[100px] mix-blend-screen" />
      </div>

      <div className="mb-8 transform hover:scale-105 transition-transform duration-500">
         <Header />
      </div>
      
      <div className="w-full max-w-sm bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-2xl mt-4 transform transition-all ring-1 ring-white/5 relative overflow-hidden">
        
        {/* Top Highlight */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent opacity-50"></div>

        <div className="flex justify-center mb-8">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-2xl ring-1 ring-white/10 shadow-lg relative">
             <div className="absolute inset-0 bg-pink-500/20 blur-xl rounded-full"></div>
            <ShieldCheck className="w-8 h-8 text-pink-400 relative z-10" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center text-white mb-2 tracking-tight">
          {isLogin ? 'Welcome Back' : 'Join Mommy'}
        </h2>
        <p className="text-slate-400 text-center text-sm mb-6 font-medium">
          {isLogin ? 'Secure authentication required' : 'Create your personal AI companion'}
        </p>
        
        {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-200 text-xs justify-center animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p>{error}</p>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative group animate-in slide-in-from-bottom-2 fade-in">
              <User className="absolute left-4 top-4 w-5 h-5 text-slate-500 group-focus-within:text-pink-400 transition-colors" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition-all placeholder-slate-600 text-sm font-medium"
              />
            </div>
          )}

          <div className="relative group">
            <Mail className="absolute left-4 top-4 w-5 h-5 text-slate-500 group-focus-within:text-pink-400 transition-colors" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition-all placeholder-slate-600 text-sm font-medium"
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-4 w-5 h-5 text-slate-500 group-focus-within:text-pink-400 transition-colors" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition-all placeholder-slate-600 text-sm font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl transition-all transform active:scale-[0.98] shadow-lg shadow-pink-500/25 flex items-center justify-center space-x-2 mt-8 group"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{isLogin ? 'Login' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            className="text-xs text-slate-500 hover:text-pink-300 transition-colors font-medium tracking-wide uppercase"
          >
            {isLogin ? "Create new account" : "Back to login"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
