
import React, { useState, useEffect } from 'react';
import { DesktopState } from '../types';
import { Wifi, Cpu, HardDrive } from 'lucide-react';

interface SystemHUDProps {
  desktopState?: DesktopState;
}

const SystemHUD: React.FC<SystemHUDProps> = ({ desktopState }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Top Left - Clock */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex flex-col items-start opacity-50">
        <h1 className="text-2xl sm:text-4xl font-mono font-bold text-pink-500/50 tracking-tighter shadow-pink-500/20 drop-shadow-md">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </h1>
        <p className="text-[10px] sm:text-xs text-pink-400/50 font-mono tracking-widest uppercase">
          {time.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
        </p>
      </div>

      {/* Top Right - Network */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex flex-col items-end opacity-50">
        <div className="flex items-center space-x-2 text-blue-400/60">
          <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest">
            {desktopState?.wifiStatus === 'connected' ? (desktopState.wifiNetwork || 'ONLINE') : 'OFFLINE'}
          </span>
          <Wifi className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="text-[8px] sm:text-[10px] text-blue-300/40 font-mono mt-0.5">
           {desktopState?.wifiStatus === 'connected' ? 'SECURE LINK' : 'NO SIGNAL'}
        </div>
      </div>

      {/* Bottom Left - CPU/RAM Stats */}
      <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 flex flex-col space-y-1.5 opacity-30 hidden sm:flex">
        <div className="flex items-center space-x-2">
            <Cpu className="w-3 h-3 text-slate-400" />
            <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-slate-400 transition-all duration-500" 
                    style={{ width: `${desktopState?.cpuUsage || 0}%` }}
                />
            </div>
            <span className="text-[9px] font-mono text-slate-400 w-8 text-right">CPU {Math.round(desktopState?.cpuUsage || 0)}%</span>
        </div>
        <div className="flex items-center space-x-2">
            <HardDrive className="w-3 h-3 text-slate-400" />
            <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-slate-400 transition-all duration-500" 
                    style={{ width: `${desktopState?.ramUsage || 0}%` }}
                />
            </div>
            <span className="text-[9px] font-mono text-slate-400 w-8 text-right">MEM {Math.round(desktopState?.ramUsage || 0)}%</span>
        </div>
      </div>
      
      {/* Bottom Right - Branding/Version */}
      <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 text-right opacity-20 hidden sm:block">
        <div className="text-[8px] font-mono text-pink-500">MOMMY.OS.KERNEL.V3.1</div>
        <div className="flex space-x-1 justify-end mt-1">
            <div className="w-1 h-1 bg-pink-500 rounded-full animate-pulse"></div>
            <div className="w-1 h-1 bg-pink-500 rounded-full animate-pulse delay-75"></div>
            <div className="w-1 h-1 bg-pink-500 rounded-full animate-pulse delay-150"></div>
        </div>
      </div>
    </div>
  );
};

export default SystemHUD;
