
export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

export interface AudioVisualizerState {
  inputVolume: number;
  outputVolume: number;
}

export interface Memory {
  id: string;
  content: string;
  timestamp: number;
}

export interface Attachment {
  type: 'image' | 'video';
  mimeType: string;
  data: string; // base64
  url?: string; // for preview
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isMemoryUpdate?: boolean;
  attachments?: Attachment[];
  videoUrl?: string; // For Veo generated videos
  isGeneratingVideo?: boolean;
}

export interface SmartDevice {
  id: string;
  name: string;
  type: 'light' | 'thermostat' | 'lock' | 'speaker' | 'system' | 'tv' | 'bluetooth' | 'watch';
  status: 'on' | 'off' | string;
  icon?: string;
  battery?: number;
}

export interface DesktopState {
  isFocusMode: boolean;
  cpuUsage: number;
  ramUsage: number;
  openApps: string[];
  performanceMode: 'balanced' | 'high_performance' | 'power_saver';
}

export interface DeviceAction {
  device: string;
  action: string;
  appName?: string; // For desktop control
}

export interface User {
  name: string;
  email: string;
  avatar?: string;
}

export interface HealthMetrics {
  isConnected: boolean;
  heartRate: number;
  steps: number;
  sleepHours: number;
  bloodOxygen: number;
  stressLevel: 'relaxed' | 'normal' | 'high';
  lastSync: number;
}
