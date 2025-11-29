
import React, { useCallback } from 'react';
import AvatarVisualizer from './AvatarVisualizer';
import SmartControlPanel from './SmartControlPanel';
import HealthPanel from './HealthPanel';
import { useGeminiLive } from '../hooks/useGeminiLive';
import { ConnectionState, SmartDevice, HealthMetrics, DesktopState } from '../types';
import { Mic, MicOff, Loader2, AlertCircle, Square, Camera, Eye, Monitor } from 'lucide-react';

interface VoiceModeProps {
  hasPermission: boolean | null;
  devices: SmartDevice[];
  desktopState?: DesktopState;
  onDeviceUpdate: (id: string, action: string, appName?: string) => void;
  healthMetrics: HealthMetrics;
  onConnectWatch: () => void;
  onBluetoothAdd?: (device: SmartDevice) => void;
}

const VoiceMode: React.FC<VoiceModeProps> = ({ 
  hasPermission, 
  devices, 
  desktopState,
  onDeviceUpdate,
  healthMetrics,
  onConnectWatch,
  onBluetoothAdd
}) => {

  const handleBluetoothScan = useCallback(async () => {
    try {
        if (!(navigator as any).bluetooth) {
            console.error("Web Bluetooth is not available in this browser.");
            return;
        }
        
        const device = await (navigator as any).bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ['battery_service']
        });

        if (device && onBluetoothAdd) {
            onBluetoothAdd({
                id: device.id,
                name: device.name || 'Unknown Device',
                type: 'bluetooth',
                status: 'connected',
                battery: 100 // Mock battery for demo
            });
        }
    } catch (e) {
        console.error("Bluetooth scan failed", e);
    }
  }, [onBluetoothAdd]);

  const { 
    connect, 
    disconnect,
    stopAudio, 
    toggleVideo,
    toggleScreenShare,
    videoRef,
    isVideoActive,
    isScreenShareActive,
    connectionState, 
    error, 
    volume 
  } = useGeminiLive(onDeviceUpdate, healthMetrics, handleBluetoothScan);

  const handleToggleConnection = () => {
    if (connectionState === ConnectionState.CONNECTED || connectionState === ConnectionState.CONNECTING) {
      disconnect();
    } else {
      connect();
    }
  };

  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;

  return (
    <div className="flex flex-col items-center w-full max-w-lg overflow-y-auto pb-20 scrollbar-none px-4">
      
      {/* Status Capsule */}
      <div className={`mb-6 flex items-center space-x-2 px-4 py-1.5 rounded-full backdrop-blur-md border shadow-lg transition-all duration-500 ${
         isConnected ? 'bg-pink-900/20 border-pink-500/30 shadow-pink-500/10' : 'bg-slate-800/40 border-white/5'
      }`}>
        <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] ${
          isConnected ? 'bg-green-400 animate-pulse shadow-green-400' : 
          isConnecting ? 'bg-yellow-400 animate-bounce' : 
          error ? 'bg-red-400' : 'bg-slate-500'
        }`} />
        <span className={`text-[10px] font-bold tracking-widest uppercase ${isConnected ? 'text-pink-200' : 'text-slate-400'}`}>
          {isConnecting ? 'Establishing Link...' : 
           isConnected ? (isScreenShareActive ? 'Desktop Vision Active' : isVideoActive ? 'Visual Link Active' : 'Audio Link Active') : 
           error ? 'Connection Lost' : 'System Standby'}
        </span>
      </div>

      {/* Main Avatar / Video Area */}
      <div className="relative w-full aspect-square max-w-[300px] flex items-center justify-center mb-8">
        
        {/* Glowing Ring Effect */}
        <div className={`absolute inset-0 rounded-full blur-3xl transition-opacity duration-1000 ${isConnected ? 'bg-gradient-to-tr from-pink-600/30 to-purple-600/30 opacity-100' : 'opacity-0'}`} />

        <div className={`relative w-full h-full rounded-[2.5rem] overflow-hidden bg-slate-900 shadow-2xl ring-1 ring-white/10 z-10 transition-all duration-500 ${isConnected ? 'ring-pink-500/30 shadow-pink-500/20' : ''}`}>
           {isVideoActive ? (
            <>
                <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover ${isScreenShareActive ? '' : 'transform scale-x-[-1]'}`} 
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 pointer-events-none" />
                {/* PiP Avatar */}
                <div className="absolute bottom-4 right-4 w-24 h-24 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl overflow-hidden ring-1 ring-black/50">
                    <AvatarVisualizer outputVolume={volume.output} isActive={isConnected} />
                </div>
            </>
            ) : (
            <AvatarVisualizer 
                outputVolume={volume.output}
                isActive={isConnected} 
            />
            )}
        </div>
      </div>

      {/* Info / Subtitles */}
      <div className="text-center h-8 mb-6">
        {isConnected ? (
            <p className="text-pink-300 font-medium text-sm animate-pulse tracking-wide">
              {volume.output > 0.05 ? "Mommy is speaking..." : (isScreenShareActive ? "Analyzing your workflow..." : isVideoActive ? "Mommy is watching you..." : "Listening...")}
            </p>
        ) : (
          <p className="text-slate-500 text-sm font-medium">
            Tap microphone to initialize.
          </p>
        )}
      </div>

      {/* Primary Controls */}
      <div className="w-full space-y-6">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-2 text-red-200 text-xs justify-center backdrop-blur-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-4 gap-4 px-2">
          {/* Call Toggle Button */}
          <button
            onClick={handleToggleConnection}
            disabled={isConnecting || hasPermission === false}
            className={`col-span-${isConnected ? '2' : '4'} h-14 rounded-2xl flex items-center justify-center space-x-2 transition-all transform active:scale-95 shadow-xl ${
              isConnected 
                ? 'bg-slate-800/80 hover:bg-slate-700 text-red-400 border border-red-500/20 hover:border-red-500/50' 
                : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-pink-500/25 ring-1 ring-white/10'
            }`}
          >
            {isConnecting ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : isConnected ? (
              <>
                <MicOff className="w-5 h-5" />
                <span className="font-bold text-sm">End Call</span>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                <span className="font-bold text-sm">Start Call</span>
              </>
            )}
          </button>
          
          {/* Secondary Controls */}
          {isConnected && (
            <>
               <button
                onClick={toggleVideo}
                className={`col-span-1 rounded-2xl border flex flex-col items-center justify-center transition-all active:scale-95 ${
                  isVideoActive && !isScreenShareActive
                  ? 'bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/30' 
                  : 'bg-slate-800/60 border-white/5 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
                title="Toggle Camera"
              >
                {isVideoActive && !isScreenShareActive ? <Eye className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
              </button>

              <button
                onClick={toggleScreenShare}
                 className={`col-span-1 rounded-2xl border flex flex-col items-center justify-center transition-all active:scale-95 ${
                  isScreenShareActive
                  ? 'bg-blue-500 text-white border-blue-400 shadow-lg shadow-blue-500/30' 
                  : 'bg-slate-800/60 border-white/5 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
                title="Share Screen"
              >
                <Monitor className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Modules */}
        <div className="space-y-4 animate-in slide-in-from-bottom-6 fade-in duration-700 delay-100">
             <HealthPanel metrics={healthMetrics} onConnect={onConnectWatch} />
             <SmartControlPanel devices={devices} desktopState={desktopState} onBluetoothAdd={handleBluetoothScan} />
        </div>
      </div>
    </div>
  );
};

export default VoiceMode;
