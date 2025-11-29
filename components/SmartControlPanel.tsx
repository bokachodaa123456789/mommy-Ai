
import React from 'react';
import { SmartDevice } from '../types';
import { Lightbulb, Thermometer, Lock, Speaker, Smartphone, Cpu, Bluetooth, Tv } from 'lucide-react';

interface SmartControlPanelProps {
  devices: SmartDevice[];
  onBluetoothAdd?: () => void;
}

const SmartControlPanel: React.FC<SmartControlPanelProps> = ({ devices, onBluetoothAdd }) => {
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
            <div className="p-1 bg-pink-500/10 rounded-md">
                <Cpu className="w-3.5 h-3.5 text-pink-400" />
            </div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Smart Home</h3>
        </div>
        <button 
            onClick={onBluetoothAdd}
            className="text-[10px] text-pink-400 hover:text-pink-300 font-medium bg-pink-500/10 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
        >
            <Bluetooth className="w-3 h-3" />
            <span>SCAN</span>
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
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
    </div>
  );
};

export default SmartControlPanel;
