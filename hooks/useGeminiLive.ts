
import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';
import { ConnectionState, SmartDevice, HealthMetrics } from '../types';
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

export const useGeminiLive = (
    onDeviceUpdate?: (id: string, status: string) => void,
    healthMetrics?: HealthMetrics,
    onBluetoothScan?: () => void
) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState<{ input: number; output: number }>({ input: 0, output: 0 });
  const [isVideoActive, setIsVideoActive] = useState(false);

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

  // Video Toggle
  const toggleVideo = useCallback(async () => {
    if (isVideoActive) {
      // Stop video
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach(track => track.stop());
        videoStreamRef.current = null;
      }
      if (videoIntervalRef.current) {
        clearInterval(videoIntervalRef.current);
        videoIntervalRef.current = null;
      }
      setIsVideoActive(false);
    } else {
      // Start video
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
        }
        setIsVideoActive(true);
      } catch (e) {
        console.error("Failed to access camera", e);
      }
    }
  }, [isVideoActive]);

  // Video Streaming Loop
  useEffect(() => {
    if (isVideoActive && connectionState === ConnectionState.CONNECTED && videoRef.current) {
       const canvas = document.createElement('canvas');
       const ctx = canvas.getContext('2d');
       
       if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);

       videoIntervalRef.current = window.setInterval(() => {
         const videoEl = videoRef.current;
         if (!videoEl || !ctx) return;
         
         const scale = 0.5;
         canvas.width = videoEl.videoWidth * scale;
         canvas.height = videoEl.videoHeight * scale;
         
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
          tools: [{ functionDeclarations: [memoryTool, deviceControlTool, healthTool, bluetoothTool] }],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: `You are Mommy, a caring, warm, and highly intelligent AI companion. 
            
            CAPABILITIES:
            1. VISUAL: You can see the user when they enable the camera.
            2. MEMORY: You can REMEMBER facts using 'remember_info'.
            3. CONTROL: You can CONTROL DEVICES using 'control_device'.
            4. HEALTH: You can CHECK HEALTH STATUS using 'get_health_status' if the user has a smart watch connected.
            5. BLUETOOTH: You can connect to Bluetooth devices using 'scan_bluetooth_devices' if the user asks.
            
            ${memoryContext}
            
            If the user asks to connect headphones, a speaker, or find bluetooth devices, call 'scan_bluetooth_devices'.
            If the user mentions feeling unwell, stressed, or asks about their heart rate, call 'get_health_status'.
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
    videoRef,
    isVideoActive,
    connectionState, 
    error, 
    volume 
  };
};
