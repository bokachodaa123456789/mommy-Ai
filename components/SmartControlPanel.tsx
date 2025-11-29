
import React, { useState } from 'react';
import { SmartDevice, DesktopState } from '../types';
import { Lightbulb, Thermometer, Lock, Speaker, Smartphone, Cpu, Bluetooth, Tv, Monitor, Zap, Command, Layers } from 'lucide-react';

interface SmartControlPanelProps {
  devices: SmartDevice[];
  desktopState?: DesktopState;
  onBluetoothAdd?: () => void;
}

const SmartControlPanel: React.FC<SmartControlPanelProps> = ({ devices, desktopState, onBluetoothAdd }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'desktop'>('home');

  const getIcon = (type: string) => {
    switch (type) {
      case 'light': return <Lightbulb className="w-5 h-5 text-yellow-400" />;
      case 'thermostat': return <Thermometer className="w-5 h-5 text-orange-400" />;
      case 'lock': return <Lock className="w-5 h-5 text-blue-400" />;
      case 'speaker': return <Speaker className="w-5 h-5 text-purple-400" />;
      case 'system': return <Cpu className="w-5 h-5 text-green-400" />;
      case 'tv': return <Tv className="w-5 h-5 text-indigo-400" />;
      case 'bluetooth': return <Bluetooth className="w-5 h-5 text-blue-500" />;
      default: return <Smartphone className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="w-full bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-white/5 p-5 shadow-xl">
      {/* Header / Tabs */}
      <div className="flex items-center justify-between mb-4">
         <div className="flex space-x-4">
             <button 
                onClick={() => setActiveTab('home')}
                className={`flex items-center space-x-2 transition-colors ${activeTab === 'home' ? 'text-white' : 'text-slate-500'}`}
             >
                <div className={`p-1 rounded-md ${activeTab === 'home' ? 'bg-pink-500/20' : ''}`}>
                    <Cpu className={`w-3.5 h-3.5 ${activeTab === 'home' ? 'text-pink-400' : 'text-slate-500'}`} />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-widest">Home</h3>
             </button>

             <button 
                onClick={() => setActiveTab('desktop')}
                className={`flex items-center space-x-2 transition-colors ${activeTab === 'desktop' ? 'text-white' : 'text-slate-500'}`}
             >
                <div className={`p-1 rounded-md ${activeTab === 'desktop' ? 'bg-blue-500/20' : ''}`}>
                    <Monitor className={`w-3.5 h-3.5 ${activeTab === 'desktop' ? 'text-blue-400' : 'text-slate-500'}`} />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-widest">Desktop</h3>
             </button>
         </div>

         {activeTab === 'home' && (
            <button 
                onClick={onBluetoothAdd}
                className="text-[10px] text-pink-400 hover:text-pink-300 font-medium bg-pink-500/10 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
            >
                <Bluetooth className="w-3 h-3" />
                <span>SCAN</span>
            </button>
         )}
      </div>
      
      {activeTab === 'home' ? (
        <div className="grid grid-cols-2 gap-3 animate-in fade-in duration-300">
            {devices.map((dev) => (
            <div 
                key={dev.id} 
                className={`p-3 rounded-xl border flex items-center justify-between transition-all duration-300 group ${
                dev.status === 'off' 
                    ? 'bg-slate-900/40 border-slate-700/50 hover:bg-slate-800/50' 
                    : 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-pink-500/30 shadow-lg shadow-pink-500/5'
                }`}
            >
                <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg transition-all duration-300 ${dev.status !== 'off' ? 'bg-slate-800 shadow-inner' : 'bg-white/5'}`}>
                    {getIcon(dev.type)}
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">{dev.name}</span>
                    <span className={`text-[9px] font-bold tracking-wide ${dev.status === 'off' ? 'text-slate-500' : 'text-green-400'}`}>
                    {dev.status === 'on' ? 'ACTIVE' : dev.status.toUpperCase()}
                    </span>
                </div>
                </div>
                
                {/* Status Dot */}
                <div className={`w-1.5 h-1.5 rounded-full shadow-sm ${dev.status === 'off' ? 'bg-slate-700' : 'bg-green-400 animate-pulse shadow-green-400'}`} />
            </div>
            ))}
        </div>
      ) : (
        <div className="space-y-3 animate-in fade-in duration-300">
             {/* Performance Card */}
             <div className="bg-slate-900/40 border border-white/5 rounded-xl p-3 flex items-center justify-between">
                 <div className="flex items-center space-x-3">
                     <Zap className="w-5 h-5 text-yellow-400" />
                     <div className="flex flex-col">
                         <span className="text-xs font-semibold text-slate-200">System Performance</span>
                         <span className="text-[9px] text-slate-500 uppercase">{desktopState?.performanceMode.replace('_', ' ') || 'Normal'}</span>
                     </div>
                 </div>
                 <div className="flex space-x-2 text-[10px] font-mono text-slate-400">
                     <span>CPU {desktopState?.cpuUsage || 12}%</span>
                     <span>RAM {desktopState?.ramUsage || 45}%</span>
                 </div>
             </div>

             {/* Focus Mode Card */}
             <div className={`border rounded-xl p-3 flex items-center justify-between transition-colors ${desktopState?.isFocusMode ? 'bg-purple-900/20 border-purple-500/30' : 'bg-slate-900/40 border-white/5'}`}>
                 <div className="flex items-center space-x-3">
                     <Command className={`w-5 h-5 ${desktopState?.isFocusMode ? 'text-purple-400' : 'text-slate-500'}`} />
                     <div className="flex flex-col">
                         <span className="text-xs font-semibold text-slate-200">Deep Focus Mode</span>
                         <span className="text-[9px] text-slate-500 uppercase">{desktopState?.isFocusMode ? 'Active' : 'Disabled'}</span>
                     </div>
                 </div>
                 <div className={`w-2 h-2 rounded-full ${desktopState?.isFocusMode ? 'bg-purple-500 animate-pulse' : 'bg-slate-700'}`} />
             </div>

             {/* Active Apps */}
             <div className="grid grid-cols-2 gap-2">
                 {desktopState?.openApps.map((app, i) => (
                     <div key={i} className="bg-slate-800/40 border border-white/5 rounded-lg p-2 flex items-center space-x-2">
                         <Layers className="w-3 h-3 text-blue-400" />
                         <span className="text-xs text-slate-300">{app}</span>
                     </div>
                 ))}
                 {(!desktopState?.openApps.length) && (
                     <span className="text-[10px] text-slate-500 italic p-2">No active applications tracked.</span>
                 )}
             </div>
        </div>
      )}
    </div>
  );
};

export default SmartControlPanel;
