
import React from 'react';
import { Sparkles, Heart } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="flex flex-col items-center justify-center py-6 px-4 z-20 relative">
      <div className="flex items-center space-x-2 mb-1">
        <Heart className="w-6 h-6 text-pink-500 fill-pink-500 animate-pulse" />
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 drop-shadow-sm tracking-tight">
          Mommy
        </h1>
      </div>
      <p className="text-slate-400 text-xs font-medium tracking-widest uppercase flex items-center opacity-80">
        AI Companion <span className="mx-2 text-slate-600">•</span> Prasanjit <Sparkles className="w-3 h-3 ml-1 text-pink-400" />
      </p>
    </header>
  );
};

export default Header;
