
import React, { useEffect, useState, useRef } from 'react';
import Header from './components/Header';
import VoiceMode from './components/VoiceMode';
import ChatInterface from './components/ChatInterface';
import MatrixBackground from './components/MatrixBackground';
import AuthScreen from './components/AuthScreen';
import { ShieldCheck, Key, Loader2, Phone, MessageSquare } from 'lucide-react';
import { SmartDevice, User, HealthMetrics, DesktopState } from './types';

const App: React.FC = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [apiKeyVerified, setApiKeyVerified] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'voice' | 'chat'>('voice');
  
  // Auth State
  const [user, setUser] = useState<User | null>(null);

  // Health State
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics>({
    isConnected: false,
    heartRate: 0,
    steps: 0,
    sleepHours: 0,
    bloodOxygen: 0,
    stressLevel: 'normal',
    lastSync: 0
  });

  const healthIntervalRef = useRef<number | null>(null);

  // Simulated Smart Home State
  const [devices, setDevices] = useState<SmartDevice[]>([
    { id: 'living_room_light', name: 'Living Room', type: 'light', status: 'off' },
    { id: 'thermostat', name: 'Thermostat', type: 'thermostat', status: '72°F' },
    { id: 'front_door_lock', name: 'Front Door', type: 'lock', status: 'locked' },
    { id: 'system_volume', name: 'Volume', type: 'speaker', status: '50%' },
    { id: 'android_tv', name: 'Smart TV', type: 'tv', status: 'off' }
  ]);

  // Simulated Desktop State
  const [desktopState, setDesktopState] = useState<DesktopState>({
      isFocusMode: false,
      cpuUsage: 12,
      ramUsage: 42,
      openApps: ['Finder', 'Chrome'],
      performanceMode: 'balanced'
  });

  const handleDeviceUpdate = (id: string, action: string, extra?: string) => {
    // Check if it is a desktop command
    if (id === 'desktop') {
        const command = action.toLowerCase();
        if (command.includes('focus') && command.includes('on')) {
            setDesktopState(prev => ({ ...prev, isFocusMode: true }));
        } else if (command.includes('focus') && command.includes('off')) {
            setDesktopState(prev => ({ ...prev, isFocusMode: false }));
        } else if (command.includes('open') && extra) {
            setDesktopState(prev => ({ ...prev, openApps: [...new Set([...prev.openApps, extra])] }));
        } else if (command.includes('close') && extra) {
            setDesktopState(prev => ({ ...prev, openApps: prev.openApps.filter(app => !app.toLowerCase().includes(extra.toLowerCase())) }));
        } else if (command.includes('performance')) {
            // handle mode change
            const mode = extra as any || 'high_performance';
            setDesktopState(prev => ({ ...prev, performanceMode: mode, cpuUsage: mode === 'high_performance' ? 45 : 12 }));
        }
        return;
    }

    setDevices(prev => prev.map(dev => {
        if (dev.id.includes(id) || id.includes(dev.id) || id.includes(dev.name.toLowerCase())) {
            let newStatus = action;
            if (action.includes('turn_on') || action === 'on') newStatus = 'on';
            if (action.includes('turn_off') || action === 'off') newStatus = 'off';
            return { ...dev, status: newStatus };
        }
        return dev;
    }));
  };
  
  const handleAddBluetoothDevice = (device: SmartDevice) => {
    setDevices(prev => {
        if (prev.find(d => d.id === device.id)) return prev;
        return [...prev, device];
    });
  };

  const handleLogin = (u: { name: string; email: string }) => {
    setUser({ ...u });
    localStorage.setItem('mommy_user', JSON.stringify(u));
  };

  const handleConnectWatch = () => {
    // Simulate connection
    setHealthMetrics(prev => ({ ...prev, isConnected: true, lastSync: Date.now() }));
    
    // Start generating fake data
    if (healthIntervalRef.current) clearInterval(healthIntervalRef.current);
    healthIntervalRef.current = window.setInterval(() => {
        setHealthMetrics(prev => ({
            ...prev,
            heartRate: 60 + Math.floor(Math.random() * 40), // 60-100 bpm
            steps: prev.steps + Math.floor(Math.random() * 10),
            sleepHours: 7.5,
            stressLevel: Math.random() > 0.8 ? 'high' : 'normal'
        }));
    }, 3000);
  };

  useEffect(() => {
    // Load user
    const savedUser = localStorage.getItem('mommy_user');
    if (savedUser) setUser(JSON.parse(savedUser));

    // Check permissions
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => setHasPermission(true))
      .catch(() => setHasPermission(false));

    // Check API Key
    const checkKey = async () => {
      const win = window as any;
      if (win.aistudio && win.aistudio.hasSelectedApiKey) {
        const hasKey = await win.aistudio.hasSelectedApiKey();
        setApiKeyVerified(hasKey);
      } else {
        setApiKeyVerified(true);
      }
    };
    checkKey();

    // Mock variable system stats
    const sysInterval = setInterval(() => {
        setDesktopState(prev => ({
            ...prev,
            cpuUsage: Math.max(5, Math.min(100, prev.cpuUsage + (Math.random() - 0.5) * 5)),
            ramUsage: Math.max(10, Math.min(90, prev.ramUsage + (Math.random() - 0.5) * 2))
        }));
    }, 5000);

    return () => {
        if (healthIntervalRef.current) clearInterval(healthIntervalRef.current);
        clearInterval(sysInterval);
    };
  }, []);

  const handleApiKeySelect = async () => {
    const win = window as any;
    if (win.aistudio && win.aistudio.openSelectKey) {
      await win.aistudio.openSelectKey();
      setApiKeyVerified(true);
    }
  };

  // 1. Auth Screen
  if (!user) {
      return <AuthScreen onLogin={handleLogin} />;
  }

  // 2. Loading / API Key Check
  if (apiKeyVerified === null) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center relative overflow-hidden">
         <MatrixBackground />
         <Loader2 className="w-10 h-10 text-pink-500 animate-spin z-10" />
      </div>
    );
  }

  // 3. Billing Screen
  if (apiKeyVerified === false) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <MatrixBackground />
        <div className="relative z-10 w-full flex flex-col items-center animate-in fade-in zoom-in duration-500">
          <Header />
          <div className="mt-8 w-full max-w-md bg-slate-900/60 p-8 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center ring-1 ring-white/5">
            <div className="bg-gradient-to-tr from-pink-500 to-purple-500 p-4 rounded-full mb-6 shadow-lg shadow-pink-500/20">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">System Locked</h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              Identity verified as <span className="text-white font-medium">{user.name}</span>. <br/>Please connect API Key to activate Mommy AI Core.
            </p>
            <button
              onClick={handleApiKeySelect}
              className="w-full py-4 px-6 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-pink-500/25 flex items-center justify-center space-x-3 active:scale-[0.98]"
            >
              <Key className="w-5 h-5" />
              <span>Connect API Key</span>
            </button>
            <div className="mt-6 text-xs text-slate-500">
               <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 underline decoration-pink-500/30 transition-colors">Get an API Key</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. Main Interface
  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center relative overflow-hidden font-sans selection:bg-pink-500/30">
      <MatrixBackground />
      
      <div className="relative z-10 w-full flex flex-col items-center flex-1">
        <Header />

        <main className="flex-1 w-full max-w-xl px-4 pb-6 flex flex-col h-[calc(100vh-110px)]">
          {/* Glass Tab Switcher */}
          <div className="p-1.5 bg-slate-900/40 rounded-2xl mb-6 backdrop-blur-md border border-white/5 flex-shrink-0 shadow-lg relative mx-4 sm:mx-10">
            <div className="flex relative z-10">
                <button
                onClick={() => setActiveTab('voice')}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                    activeTab === 'voice' 
                    ? 'text-white' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                >
                <Phone className={`w-4 h-4 ${activeTab === 'voice' ? 'text-pink-300' : ''}`} />
                <span>Voice Call</span>
                </button>
                <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                    activeTab === 'chat' 
                    ? 'text-white' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                >
                <MessageSquare className={`w-4 h-4 ${activeTab === 'chat' ? 'text-purple-300' : ''}`} />
                <span>Chat</span>
                </button>
            </div>
            
            {/* Animated Slider Background */}
            <div 
                className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-slate-800/80 rounded-xl shadow-sm border border-white/5 transition-all duration-300 ease-spring ${activeTab === 'voice' ? 'left-1.5' : 'left-[calc(50%+3px)]'}`}
            />
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col min-h-0 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'voice' ? (
              <VoiceMode 
                hasPermission={hasPermission} 
                devices={devices} 
                desktopState={desktopState}
                onDeviceUpdate={handleDeviceUpdate}
                healthMetrics={healthMetrics}
                onConnectWatch={handleConnectWatch}
                onBluetoothAdd={handleAddBluetoothDevice}
              />
            ) : (
              <ChatInterface 
                devices={devices}
                onDeviceUpdate={handleDeviceUpdate}
                healthMetrics={healthMetrics}
              />
            )}
          </div>
        </main>
        
        <div className="pb-2 text-center opacity-40 hover:opacity-100 transition-opacity">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold flex items-center justify-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
             User: {user.name} 
             <span className="text-slate-600">|</span>
             Secure Channel
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
