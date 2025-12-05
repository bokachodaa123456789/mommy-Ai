
import React, { useState } from 'react';
import { SmartDevice, DesktopState } from '../types';
import { Lightbulb, Thermometer, Lock, Speaker, Smartphone, Cpu, Bluetooth, Tv, Monitor, Zap, Command, Layers, Wifi, HardDrive, Activity, Download } from 'lucide-react';

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
                     <Zap className={`w-5 h-5 ${
                         desktopState?.performanceMode === 'high_performance' ? 'text-red-400' : 
                         desktopState?.performanceMode === 'power_saver' ? 'text-green-400' : 'text-yellow-400'
                     }`} />
                     <div className="flex flex-col">
                         <span className="text-xs font-semibold text-slate-200">System Performance</span>
                         <span className="text-[9px] text-slate-500 uppercase">{desktopState?.performanceMode.replace('_', ' ') || 'Normal'}</span>
                     </div>
                 </div>
                 <div className="flex space-x-2 text-[10px] font-mono text-slate-400">
                     <span>CPU {desktopState?.cpuUsage ? Math.round(desktopState.cpuUsage) : 0}%</span>
                     <span>RAM {desktopState?.ramUsage ? Math.round(desktopState.ramUsage) : 0}%</span>
                 </div>
             </div>

             {/* Focus & Wi-Fi */}
             <div className="grid grid-cols-2 gap-3">
                 {/* Focus Mode */}
                 <div className={`border rounded-xl p-3 flex items-center justify-between transition-colors ${desktopState?.isFocusMode ? 'bg-purple-900/20 border-purple-500/30' : 'bg-slate-900/40 border-white/5'}`}>
                     <div className="flex items-center space-x-2">
                         <Command className={`w-4 h-4 ${desktopState?.isFocusMode ? 'text-purple-400' : 'text-slate-500'}`} />
                         <span className="text-[10px] font-bold text-slate-300 uppercase">Focus</span>
                     </div>
                     <div className={`w-1.5 h-1.5 rounded-full ${desktopState?.isFocusMode ? 'bg-purple-500 animate-pulse' : 'bg-slate-700'}`} />
                 </div>

                 {/* Wi-Fi */}
                 <div className={`border rounded-xl p-3 flex items-center justify-between transition-colors ${desktopState?.wifiStatus === 'connected' ? 'bg-blue-900/20 border-blue-500/30' : 'bg-slate-900/40 border-white/5'}`}>
                     <div className="flex items-center space-x-2">
                         <Wifi className={`w-4 h-4 ${desktopState?.wifiStatus === 'connected' ? 'text-blue-400' : 'text-slate-500'}`} />
                         <div className="flex flex-col">
                             <span className="text-[10px] font-bold text-slate-300 uppercase">Wi-Fi</span>
                             <span className="text-[9px] text-slate-400 max-w-[80px] truncate">
                                {desktopState?.wifiStatus === 'connected' ? (desktopState?.wifiNetwork || 'Connected') : 
                                 desktopState?.wifiStatus === 'scanning' ? 'Scanning...' : 'Off'}
                             </span>
                         </div>
                     </div>
                     {desktopState?.wifiStatus === 'connected' && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
                 </div>
             </div>
             
             {/* Drivers & Downloads */}
             <div className="bg-slate-900/40 border border-white/5 rounded-xl p-3 flex items-center justify-between relative overflow-hidden">
                 {desktopState?.downloadStatus?.active && (
                    <div className="absolute inset-0 bg-emerald-500/10 z-0">
                        <div className="h-full bg-emerald-500/20 transition-all duration-300" style={{ width: `${desktopState.downloadStatus.progress}%` }} />
                    </div>
                 )}
                 <div className="flex items-center space-x-3 relative z-10">
                     <HardDrive className={`w-5 h-5 ${desktopState?.driversStatus === 'optimal' ? 'text-emerald-400' : desktopState?.driversStatus === 'updating' ? 'text-yellow-400' : 'text-red-400'}`} />
                     <div className="flex flex-col">
                         <span className="text-xs font-semibold text-slate-200">
                             {desktopState?.downloadStatus?.active ? `Downloading: ${desktopState.downloadStatus.file}` : 'Device Drivers'}
                         </span>
                         <span className="text-[9px] text-slate-500 uppercase">
                             {desktopState?.downloadStatus?.active 
                                ? `${desktopState.downloadStatus.progress}% Complete` 
                                : (desktopState?.driversStatus === 'updating' ? 'Checking Updates...' : desktopState?.driversStatus === 'optimal' ? 'Up to date' : 'Update Required')}
                         </span>
                     </div>
                 </div>
                 {(desktopState?.driversStatus === 'updating' || desktopState?.downloadStatus?.active) && (
                     <Download className="w-4 h-4 text-emerald-400 animate-bounce relative z-10" />
                 )}
             </div>

             {/* Process Monitor */}
             <div className="bg-slate-900/40 border border-white/5 rounded-xl p-3">
                 <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Activity className="w-3 h-3" /> Process Monitor
                    </h4>
                 </div>
                 <div className="space-y-1.5 max-h-[120px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                    {desktopState?.processes.map((proc) => (
                        <div key={proc.id} className="flex items-center justify-between bg-slate-800/40 p-1.5 rounded-lg border border-white/5">
                            <div className="flex items-center space-x-2">
                                <div className={`w-1 h-1 rounded-full ${proc.priority === 'high' ? 'bg-red-400' : proc.priority === 'low' ? 'bg-green-400' : 'bg-blue-400'}`} />
                                <span className="text-xs text-slate-300 font-mono truncate max-w-[80px]">{proc.name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-[9px] text-slate-500 uppercase">{proc.priority}</span>
                                <span className="text-[10px] text-slate-400 font-mono w-8 text-right">{proc.cpu.toFixed(1)}%</span>
                            </div>
                        </div>
                    ))}
                 </div>
             </div>
        </div>
      )}
    </div>
  );
};

export default SmartControlPanel;
