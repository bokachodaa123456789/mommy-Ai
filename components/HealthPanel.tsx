
import React from 'react';
import { Heart, Activity, Moon, Footprints, Watch } from 'lucide-react';
import { HealthMetrics } from '../types';

interface HealthPanelProps {
  metrics: HealthMetrics;
  onConnect: () => void;
}

const HealthPanel: React.FC<HealthPanelProps> = ({ metrics, onConnect }) => {
  if (!metrics.isConnected) {
    return (
      <div className="w-full bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/5 p-1 flex items-center justify-between pr-2 shadow-lg">
        <div className="flex items-center space-x-3 p-3">
          <div className="bg-slate-800 p-2.5 rounded-xl border border-white/5 shadow-inner">
            <Watch className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">Health Sync</h3>
            <p className="text-[10px] text-slate-400">Connect Watch</p>
          </div>
        </div>
        <button 
          onClick={onConnect}
          className="px-4 py-2 bg-pink-600/90 hover:bg-pink-500 text-white text-[10px] font-bold rounded-xl transition-all shadow-lg shadow-pink-500/20 active:scale-95 tracking-wide"
        >
          CONNECT
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-white/5 p-5 shadow-xl relative overflow-hidden">
      {/* Background Pulse */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-2xl -mr-10 -mt-10"></div>

      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
          <h3 className="text-xs font-bold text-green-400 uppercase tracking-widest">Biometrics Live</h3>
        </div>
        <Activity className="w-4 h-4 text-green-500/50" />
      </div>

      <div className="grid grid-cols-3 gap-2 relative z-10">
        {/* Heart Rate */}
        <div className="bg-slate-900/60 rounded-xl p-3 border border-white/5 flex flex-col items-center relative overflow-hidden group hover:border-red-500/30 transition-colors">
          <div className="absolute top-2 right-2">
             <Heart className="w-3 h-3 text-red-500 animate-pulse" fill="currentColor" />
          </div>
          <span className="text-2xl font-bold text-white mb-0.5 tracking-tight">{metrics.heartRate}</span>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-red-300 transition-colors">BPM</span>
          {/* Heartbeat Graph Simulation */}
          <div className="w-full h-3 mt-2 flex items-end space-x-[1px] opacity-40">
             {[...Array(12)].map((_,i) => (
                <div key={i} className="bg-red-500 w-full rounded-t-full transition-all duration-300" style={{height: `${30 + Math.random() * 70}%`}} />
             ))}
          </div>
        </div>

        {/* Steps */}
        <div className="bg-slate-900/60 rounded-xl p-3 border border-white/5 flex flex-col items-center group hover:border-blue-500/30 transition-colors">
          <Footprints className="w-4 h-4 text-blue-400 mb-2 opacity-80" />
          <span className="text-xl font-bold text-white mb-1 tracking-tight">{metrics.steps > 1000 ? `${(metrics.steps/1000).toFixed(1)}k` : metrics.steps}</span>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-blue-300 transition-colors">STEPS</span>
          <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
            <div className="bg-blue-500 h-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" style={{ width: `${Math.min((metrics.steps / 10000) * 100, 100)}%` }} />
          </div>
        </div>

        {/* Sleep/Stress */}
        <div className="bg-slate-900/60 rounded-xl p-3 border border-white/5 flex flex-col items-center justify-between group hover:border-purple-500/30 transition-colors">
           <div className="flex flex-col items-center">
              <Moon className="w-3.5 h-3.5 text-purple-400 mb-1 opacity-80" />
              <span className="text-lg font-bold text-white">{metrics.sleepHours}h</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-purple-300 transition-colors">SLEEP</span>
           </div>
           <div className={`mt-1 text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
               metrics.stressLevel === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
           }`}>
               {metrics.stressLevel}
           </div>
        </div>
      </div>
    </div>
  );
};

export default HealthPanel;
