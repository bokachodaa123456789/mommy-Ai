
import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';
import { ConnectionState, SmartDevice, HealthMetrics, Mood } from '../types';
import { decodeBase64, decodeAudioData, encodeBase64, blobToBase64 } from '../utils/audioUtils';
import { addMemory, getSystemMemoryContext } from '../utils/memoryUtils';

// Constants for Audio
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const BUFFER_SIZE = 4096;
const VIDEO_FRAME_RATE = 1000 / 2; // 2 FPS

const memoryTool: FunctionDeclaration = {
  name: "remember_info",
  description: "Save a new fact, preference, or important detail about the user to your long-term memory.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      info: {
        type: Type.STRING,
        description: "The specific information to remember."
      }
    },
    required: ["info"]
  }
};

const deviceControlTool: FunctionDeclaration = {
  name: "control_device",
  description: "Control smart home devices or system settings.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      device_id: {
        type: Type.STRING,
        description: "The ID or name of the device."
      },
      action: {
        type: Type.STRING,
        description: "The action to perform."
      }
    },
    required: ["device_id", "action"]
  }
};

const desktopControlTool: FunctionDeclaration = {
  name: "control_desktop",
  description: "Control desktop environment, manage applications, and optimize system performance.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        description: "Action: 'turn_on_focus_mode', 'turn_off_focus_mode', 'open_app', 'close_app', 'set_performance_mode', 'kill_process', 'set_app_priority'."
      },
      app_name: {
        type: Type.STRING,
        description: "Name of application or process."
      },
      mode: {
        type: Type.STRING,
        description: "For performance: 'high_performance', 'balanced', 'power_saver'."
      },
      priority: {
        type: Type.STRING,
        description: "For set_app_priority: 'low', 'normal', 'high'."
      }
    },
    required: ["action"]
  }
};

const healthTool: FunctionDeclaration = {
  name: "get_health_status",
  description: "Retrieve the user's current health metrics (heart rate, steps, sleep) from their smart watch.",
  parameters: {
    type: Type.OBJECT,
    properties: {}, // No params needed
  }
};

const bluetoothTool: FunctionDeclaration = {
  name: "scan_bluetooth_devices",
  description: "Scan for and connect to nearby Bluetooth devices like headphones, speakers, or TVs.",
  parameters: {
    type: Type.OBJECT,
    properties: {}, // No params needed
  }
};

const wifiTool: FunctionDeclaration = {
  name: "manage_wifi",
  description: "Scan for Wi-Fi networks or check connection status.",
  parameters: {
    type: Type.OBJECT,
    properties: {
        action: {
            type: Type.STRING,
            description: "'scan' or 'status'"
        }
    },
    required: ["action"]
  }
};

const driverTool: FunctionDeclaration = {
  name: "update_drivers",
  description: "Check for and update compatible device drivers.",
  parameters: {
    type: Type.OBJECT,
    properties: {}, 
  }
};

const downloadTool: FunctionDeclaration = {
    name: "download_file",
    description: "Download a specific file or driver for the user's device.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            filename: { type: Type.STRING, description: "Name of the file or driver" },
            filetype: { type: Type.STRING, description: "Type: 'driver', 'app', 'document'" }
        },
        required: ["filename"]
    }
};

const tasksTool: FunctionDeclaration = {
    name: "manage_tasks",
    description: "Add or manage user tasks.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            action: { type: Type.STRING, description: "'add', 'complete', 'list'" },
            task_text: { type: Type.STRING, description: "Text of the task" }
        },
        required: ["action"]
    }
};

const moodTool: FunctionDeclaration = {
    name: "set_mood",
    description: "Update your own emotional state based on the conversation.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            mood: { type: Type.STRING, description: "'neutral', 'happy', 'concerned', 'focused', 'excited'" }
        },
        required: ["mood"]
    }
};

const mediaTool: FunctionDeclaration = {
    name: "manage_media",
    description: "Control media input devices like camera.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            command: { type: Type.STRING, description: "'turn_on_camera', 'turn_off_camera'" }
        },
        required: ["command"]
    }
};

export const useGeminiLive = (
    onDeviceUpdate?: (id: string, status: string, appName?: string, priority?: string) => void,
    healthMetrics?: HealthMetrics,
    onBluetoothScan?: () => void
) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState<{ input: number; output: number }>({ input: 0, output: 0 });
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [isScreenShareActive, setIsScreenShareActive] = useState(false);

  // Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioQueueRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Video Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const videoIntervalRef = useRef<number | null>(null);
  
  // State Refs for Callbacks
  const videoStateRef = useRef({ isActive: false, toggle: async () => {} });

  const cleanup = useCallback(() => {
    // Stop audio
    audioQueueRef.current.forEach(source => {
      try { source.stop(); } catch (e) { /* ignore */ }
    });
    audioQueueRef.current.clear();

    // Disconnect inputs
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }
    if (inputSourceRef.current) {
      inputSourceRef.current.disconnect();
      inputSourceRef.current = null;
    }
    
    // Close contexts
    if (inputAudioContextRef.current?.state !== 'closed') {
      inputAudioContextRef.current?.close();
    }
    if (outputAudioContextRef.current?.state !== 'closed') {
      outputAudioContextRef.current?.close();
    }
    
    // Stop audio tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Stop video tracks
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(track => track.stop());
      videoStreamRef.current = null;
    }
    if (videoIntervalRef.current) {
      clearInterval(videoIntervalRef.current);
      videoIntervalRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    inputAudioContextRef.current = null;
    outputAudioContextRef.current = null;
    sessionPromiseRef.current = null;
    nextStartTimeRef.current = 0;
    setIsVideoActive(false);
    setIsScreenShareActive(false);
  }, []);

  const stopAudio = useCallback(() => {
    audioQueueRef.current.forEach(source => {
      try { source.stop(); } catch (e) { /* ignore */ }
    });
    audioQueueRef.current.clear();
    if (outputAudioContextRef.current) {
       nextStartTimeRef.current = outputAudioContextRef.current.currentTime;
    }
  }, []);

  const stopVideoSource = useCallback(() => {
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach(track => track.stop());
        videoStreamRef.current = null;
      }
      if (videoIntervalRef.current) {
        clearInterval(videoIntervalRef.current);
        videoIntervalRef.current = null;
      }
      setIsVideoActive(false);
      setIsScreenShareActive(false);
  }, []);

  // Toggle Camera
  const toggleVideo = useCallback(async () => {
    if (isVideoActive && !isScreenShareActive) {
      stopVideoSource();
    } else {
      // Start Camera
      stopVideoSource(); // Stop screen share if active
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          } 
        });
        videoStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.error);
        }
        setIsVideoActive(true);
        setIsScreenShareActive(false);
      } catch (e) {
        console.warn("Failed to access camera with ideal constraints, retrying with defaults...", e);
        // Retry with default settings
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoStreamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(console.error);
            }
            setIsVideoActive(true);
            setIsScreenShareActive(false);
        } catch (e2) {
             console.error("Camera access failed completely", e2);
             setError("Camera access denied or failed.");
        }
      }
    }
  }, [isVideoActive, isScreenShareActive, stopVideoSource]);

  // Toggle Screen Share
  const toggleScreenShare = useCallback(async () => {
      if (isScreenShareActive) {
          stopVideoSource();
      } else {
          stopVideoSource(); // Stop camera if active
          try {
              const stream = await navigator.mediaDevices.getDisplayMedia({
                  video: {
                      width: { ideal: 1280 },
                      height: { ideal: 720 },
                      frameRate: { ideal: 5 }
                  },
                  audio: false // We use microphone for audio
              });
              
              // Handle user stopping share via browser UI
              stream.getVideoTracks()[0].onended = () => {
                  stopVideoSource();
              };

              videoStreamRef.current = stream;
              if (videoRef.current) {
                  videoRef.current.srcObject = stream;
                  videoRef.current.play().catch(console.error);
              }
              setIsVideoActive(true);
              setIsScreenShareActive(true);
          } catch (e) {
              console.error("Failed to share screen", e);
              setError("Screen sharing failed.");
          }
      }
  }, [isScreenShareActive, stopVideoSource]);

  // Sync ref for tool callbacks
  useEffect(() => {
    videoStateRef.current = { isActive: isVideoActive, toggle: toggleVideo };
  }, [isVideoActive, toggleVideo]);

  // Video/Screen Streaming Loop
  useEffect(() => {
    if (isVideoActive && connectionState === ConnectionState.CONNECTED && videoRef.current) {
       const canvas = document.createElement('canvas');
       const ctx = canvas.getContext('2d');
       
       if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);

       videoIntervalRef.current = window.setInterval(() => {
         const videoEl = videoRef.current;
         if (!videoEl || !ctx || videoEl.readyState < 2) return; // Wait for HAVE_CURRENT_DATA
         
         const scale = 0.5;
         canvas.width = videoEl.videoWidth * scale;
         canvas.height = videoEl.videoHeight * scale;
         
         if (canvas.width === 0 || canvas.height === 0) return;

         ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
         
         canvas.toBlob(async (blob) => {
           if (!blob) return;
           const base64Data = await blobToBase64(blob);
           sessionPromiseRef.current?.then((session) => {
             session.sendRealtimeInput({
               media: { mimeType: 'image/jpeg', data: base64Data }
             });
           });
         }, 'image/jpeg', 0.6);

       }, VIDEO_FRAME_RATE);
    }

    return () => {
      if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
    };
  }, [isVideoActive, connectionState]);

  const updateVolume = () => {
    let inputVol = 0;
    let outputVol = 0;

    if (inputAnalyserRef.current) {
      const dataArray = new Uint8Array(inputAnalyserRef.current.frequencyBinCount);
      inputAnalyserRef.current.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      inputVol = avg / 255;
    }

    if (outputAnalyserRef.current) {
      const dataArray = new Uint8Array(outputAnalyserRef.current.frequencyBinCount);
      outputAnalyserRef.current.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      outputVol = avg / 255;
    }

    setVolume({ input: inputVol, output: outputVol });
    animationFrameRef.current = requestAnimationFrame(updateVolume);
  };

  const connect = useCallback(async () => {
    if (!process.env.API_KEY) {
      setError("API Key not found.");
      return;
    }

    try {
      setConnectionState(ConnectionState.CONNECTING);
      setError(null);

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      inputAudioContextRef.current = new AudioContextClass({ sampleRate: INPUT_SAMPLE_RATE });
      outputAudioContextRef.current = new AudioContextClass({ sampleRate: OUTPUT_SAMPLE_RATE });

      inputAnalyserRef.current = inputAudioContextRef.current.createAnalyser();
      inputAnalyserRef.current.fftSize = 256;
      outputAnalyserRef.current = outputAudioContextRef.current.createAnalyser();
      outputAnalyserRef.current.fftSize = 256;

      updateVolume();

      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const memoryContext = getSystemMemoryContext();

      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          tools: [{ functionDeclarations: [
              memoryTool, 
              deviceControlTool, 
              desktopControlTool, 
              healthTool, 
              bluetoothTool,
              wifiTool,
              driverTool,
              downloadTool,
              tasksTool,
              moodTool,
              mediaTool
          ] }],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: `You are Mommy, a caring, warm, and highly intelligent AI companion. 
            
            CAPABILITIES:
            1. VISUAL: You can see the user/camera OR their SCREEN if they share it. 
               - If you see a desktop screen, analyze the user's work, productivity, or help them find things.
               - Turn camera on/off using 'manage_media'.
            2. MEMORY: You can REMEMBER facts using 'remember_info'.
            3. CONTROL: 
               - Control smart home devices using 'control_device'.
               - Control DESKTOP/COMPUTER using 'control_desktop'.
                 * Actions: 'open_app', 'close_app', 'kill_process', 'set_app_priority'.
                 * Performance: 'high_performance', 'balanced', 'power_saver'.
               - Manage Wi-Fi using 'manage_wifi'.
               - Update drivers using 'update_drivers'.
               - Download files/drivers using 'download_file'.
            4. HEALTH: Check health status using 'get_health_status'.
            5. BLUETOOTH: Connect devices using 'scan_bluetooth_devices'.
            6. MOOD: Update your own emotional state using 'set_mood'.
            
            ${memoryContext}
            
            If the user asks to "download drivers" or "get files for device", use 'download_file'.
            If the user shares their screen, comment on what you see. If they are working hard, praise them.
            Always be nurturing. You are a top-class AI agent.`,
        },
        callbacks: {
          onopen: () => {
            console.log('Session Opened');
            setConnectionState(ConnectionState.CONNECTED);
            if (!inputAudioContextRef.current || !streamRef.current) return;

            const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
            inputSourceRef.current = source;
            source.connect(inputAnalyserRef.current!);

            const processor = inputAudioContextRef.current.createScriptProcessor(BUFFER_SIZE, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16Data = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                const s = Math.max(-1, Math.min(1, inputData[i]));
                int16Data[i] = s * 32768;
              }
              const base64Data = encodeBase64(new Uint8Array(int16Data.buffer));
              
              sessionPromiseRef.current?.then((session) => {
                session.sendRealtimeInput({
                  media: { mimeType: 'audio/pcm;rate=16000', data: base64Data }
                });
              });
            };

            source.connect(processor);
            processor.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.toolCall) {
              const responses = [];
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'remember_info') {
                  const info = (fc.args as any).info;
                  addMemory(info);
                  responses.push({
                    id: fc.id,
                    name: fc.name,
                    response: { result: "Memory saved." }
                  });
                } else if (fc.name === 'control_device') {
                  const { device_id, action } = (fc.args as any);
                  if (onDeviceUpdate) onDeviceUpdate(device_id, action);
                  responses.push({
                    id: fc.id,
                    name: fc.name,
                    response: { result: `Executed: ${action} on ${device_id}` }
                  });
                } else if (fc.name === 'control_desktop') {
                  const { action, app_name, mode, priority } = (fc.args as any);
                  if (onDeviceUpdate) onDeviceUpdate('desktop', action, app_name || mode, priority);
                  responses.push({
                      id: fc.id,
                      name: fc.name,
                      response: { result: `Desktop action ${action} executed.` }
                  });
                } else if (fc.name === 'get_health_status') {
                    // Return current health metrics
                    const data = healthMetrics || { isConnected: false, heartRate: 0 };
                    responses.push({
                        id: fc.id,
                        name: fc.name,
                        response: { result: JSON.stringify(data) }
                    });
                } else if (fc.name === 'scan_bluetooth_devices') {
                    if (onBluetoothScan) onBluetoothScan();
                    responses.push({
                        id: fc.id,
                        name: fc.name,
                        response: { result: "Scanning initiated on client." }
                    });
                } else if (fc.name === 'manage_wifi') {
                    const action = (fc.args as any).action;
                    if (onDeviceUpdate) onDeviceUpdate('wifi', action);
                    responses.push({
                        id: fc.id,
                        name: fc.name,
                        response: { result: `WiFi action ${action} executed.` }
                    });
                } else if (fc.name === 'update_drivers') {
                    if (onDeviceUpdate) onDeviceUpdate('drivers', 'update');
                    responses.push({
                        id: fc.id,
                        name: fc.name,
                        response: { result: "Driver update check started." }
                    });
                } else if (fc.name === 'download_file') {
                    const { filename } = (fc.args as any);
                    if (onDeviceUpdate) onDeviceUpdate('download', 'start', filename);
                    responses.push({
                        id: fc.id,
                        name: fc.name,
                        response: { result: `Downloading ${filename}...` }
                    });
                } else if (fc.name === 'manage_tasks') {
                    const { action, task_text } = (fc.args as any);
                    if (onDeviceUpdate) onDeviceUpdate('tasks', action, task_text);
                    responses.push({
                        id: fc.id,
                        name: fc.name,
                        response: { result: `Task ${action} processed.` }
                    });
                } else if (fc.name === 'set_mood') {
                    const mood = (fc.args as any).mood;
                    if (onDeviceUpdate) onDeviceUpdate('mood', mood);
                     responses.push({
                        id: fc.id,
                        name: fc.name,
                        response: { result: `Mood updated to ${mood}` }
                    });
                } else if (fc.name === 'manage_media') {
                    const { command } = (fc.args as any);
                    const { isActive, toggle } = videoStateRef.current;
                    let result = "No action taken.";
                    
                    if (command === 'turn_on_camera') {
                        if (!isActive) {
                            toggle();
                            result = "Camera enabled.";
                        } else {
                            result = "Camera is already active.";
                        }
                    } else if (command === 'turn_off_camera') {
                        if (isActive) {
                            toggle();
                            result = "Camera disabled.";
                        } else {
                            result = "Camera is already off.";
                        }
                    }
                    
                    responses.push({
                        id: fc.id,
                        name: fc.name,
                        response: { result }
                    });
                }
              }
              sessionPromiseRef.current?.then(session => {
                session.sendToolResponse({ functionResponses: responses });
              });
            }

            if (message.serverContent?.interrupted) {
              stopAudio();
              return;
            }

            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), ctx, OUTPUT_SAMPLE_RATE, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAnalyserRef.current!);
              outputAnalyserRef.current!.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              source.onended = () => audioQueueRef.current.delete(source);
              audioQueueRef.current.add(source);
            }
          },
          onclose: () => setConnectionState(ConnectionState.DISCONNECTED),
          onerror: (err) => {
            console.error(err);
            setConnectionState(ConnectionState.ERROR);
          }
        }
      });
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Connection failed");
      setConnectionState(ConnectionState.ERROR);
      cleanup();
    }
  }, [cleanup, stopAudio, onDeviceUpdate, healthMetrics, onBluetoothScan]);

  const disconnect = useCallback(() => {
    cleanup();
    setConnectionState(ConnectionState.DISCONNECTED);
  }, [cleanup]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return { 
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
  };
};
