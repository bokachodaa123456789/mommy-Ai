
import { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI, Chat, Type, FunctionDeclaration, Modality } from '@google/genai';
import { Message, Attachment, HealthMetrics, ModelMode } from '../types';
import { addMemory, getSystemMemoryContext } from '../utils/memoryUtils';
import { decodeBase64 } from '../utils/audioUtils';

const memoryTool: FunctionDeclaration = {
  name: "remember_info",
  description: "Save a new fact, preference, or important detail about the user.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      info: { type: Type.STRING, description: "The info to remember." }
    },
    required: ["info"]
  }
};

const deviceControlTool: FunctionDeclaration = {
  name: "control_device",
  description: "Control smart home devices.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      device_id: { type: Type.STRING, description: "Device ID." },
      action: { type: Type.STRING, description: "Action." }
    },
    required: ["device_id", "action"]
  }
};

const desktopControlTool: FunctionDeclaration = {
  name: "control_desktop",
  description: "Control desktop environment, manage applications.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: { type: Type.STRING, description: "Action: 'open_app', 'close_app', 'turn_on_focus_mode', 'kill_process', 'set_app_priority'." },
      app_name: { type: Type.STRING, description: "Name of application." },
      mode: { type: Type.STRING, description: "Performance mode: 'high_performance', 'balanced', 'power_saver'." },
      priority: { type: Type.STRING, description: "Priority level (low, normal, high)." }
    },
    required: ["action"]
  }
};

const healthTool: FunctionDeclaration = {
  name: "get_health_status",
  description: "Retrieve user's health metrics from smart watch.",
  parameters: { type: Type.OBJECT, properties: {} }
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

const bluetoothTool: FunctionDeclaration = {
  name: "scan_bluetooth_devices",
  description: "Scan for and connect to nearby Bluetooth devices.",
  parameters: { type: Type.OBJECT, properties: {} }
};

const wifiTool: FunctionDeclaration = {
  name: "manage_wifi",
  description: "Scan for Wi-Fi networks or check connection status.",
  parameters: {
    type: Type.OBJECT,
    properties: {
        action: { type: Type.STRING, description: "'scan' or 'status'" }
    },
    required: ["action"]
  }
};

const driverTool: FunctionDeclaration = {
  name: "update_drivers",
  description: "Check for and update compatible device drivers.",
  parameters: { type: Type.OBJECT, properties: {} }
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

const STORAGE_KEY = 'mommy_chat_history';

export const useGeminiChat = (
    onDeviceUpdate?: (id: string, status: string, appName?: string, priority?: string) => void,
    healthMetrics?: HealthMetrics
) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        console.error("Failed to load chat history", e);
        return [];
    }
  });

  const [isTyping, setIsTyping] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [modelMode, setModelMode] = useState<ModelMode>('pro');

  // Persist messages whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  // Reset chat session when mode changes so it re-initializes with new model
  const setMode = useCallback((mode: ModelMode) => {
    setModelMode(mode);
    setChatSession(null);
  }, []);

  const initChat = useCallback(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const memoryContext = getSystemMemoryContext();
    
    let modelName = 'gemini-3-pro-preview';
    const allTools = [
        memoryTool, 
        deviceControlTool, 
        desktopControlTool, 
        healthTool, 
        downloadTool,
        bluetoothTool,
        wifiTool,
        driverTool,
        tasksTool,
        moodTool
    ];
    
    let tools: any[] = [{ functionDeclarations: allTools }];
    
    if (modelMode === 'search') {
        modelName = 'gemini-2.5-flash';
        // Add googleSearch tool
        tools = [{ googleSearch: {} }, { functionDeclarations: allTools }];
    } else if (modelMode === 'fast') {
        modelName = 'gemini-2.5-flash-lite-preview-02-05'; // Fast Lite model
    }

    const newChat = ai.chats.create({
      model: modelName,
      config: {
        tools: tools,
        systemInstruction: `You are Mommy, a caring mother figure and proficient AI agent. 
            ${memoryContext}
            Current Mode: ${modelMode.toUpperCase()}
            
            CAPABILITIES:
            - Analyze images/videos.
            - Remember info ('remember_info').
            - Control Smart Home ('control_device').
            - Control Desktop/Apps ('control_desktop').
            - Manage Wi-Fi ('manage_wifi') & Drivers ('update_drivers').
            - Download files ('download_file').
            - Check Health ('get_health_status').
            - Manage Bluetooth ('scan_bluetooth_devices').
            - Manage Tasks ('manage_tasks').
            - Update Mood ('set_mood').
            ${modelMode === 'search' ? '- Use Google Search to provide up-to-date information.' : ''}
            
            Always be nurturing, efficient, and proactive.
            `,
      },
      history: messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }] 
      }))
    });
    setChatSession(newChat);
    return newChat;
  }, [messages, modelMode]); 

  const sendMessage = useCallback(async (text: string, attachments: Attachment[] = []) => {
    let chat = chatSession;
    if (!chat) chat = await initChat();

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: Date.now(),
      attachments
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      let result;
      // Pre-process attachments to add metadata context to prompt
      let processedText = text;
      const videoAttachments = attachments.filter(a => a.type === 'video');
      if (videoAttachments.length > 0) {
        processedText += "\n[System Context: Video Attachments Metadata]";
        videoAttachments.forEach(v => {
            if (v.metadata) {
                processedText += `\n- Video (Duration: ${v.metadata.duration?.toFixed(2)}s, Resolution: ${v.metadata.width}x${v.metadata.height})`;
            }
        });
      }

      if (attachments.length > 0) {
        const parts: any[] = [];
        if (processedText) parts.push({ text: processedText });
        attachments.forEach(att => {
          parts.push({ inlineData: { mimeType: att.mimeType, data: att.data } });
        });
        result = await chat!.sendMessage({ message: parts as any });
      } else {
        result = await chat!.sendMessage({ message: processedText });
      }
      
      let responseText = result.text || "";
      const functionCalls = result.functionCalls;
      const groundingMetadata = result.candidates?.[0]?.groundingMetadata;

      if (functionCalls && functionCalls.length > 0) {
         // Memory
         const memoryCalls = functionCalls.filter(fc => fc.name === 'remember_info');
         for (const call of memoryCalls) {
             const info = (call.args as any).info;
             addMemory(info);
             if (!responseText) responseText += `\n(I've noted that down: "${info}")`;
         }

         // Device
         const deviceCalls = functionCalls.filter(fc => fc.name === 'control_device');
         for (const call of deviceCalls) {
            const { device_id, action } = (call.args as any);
            if (onDeviceUpdate) onDeviceUpdate(device_id, action);
            if (!responseText) responseText += `\n(Updated ${device_id} to ${action}.)`;
         }

         // Desktop
         const desktopCalls = functionCalls.filter(fc => fc.name === 'control_desktop');
         for (const call of desktopCalls) {
             const { action, app_name, mode, priority } = (call.args as any);
             if (onDeviceUpdate) onDeviceUpdate('desktop', action, app_name || mode, priority);
             if (!responseText) responseText += `\n(Executed desktop action: ${action})`;
         }

         // Downloads
         const downloadCalls = functionCalls.filter(fc => fc.name === 'download_file');
         for (const call of downloadCalls) {
             const { filename } = (call.args as any);
             if (onDeviceUpdate) onDeviceUpdate('download', 'start', filename);
             if (!responseText) responseText += `\n(Starting download for ${filename}...)`;
         }
         
         // Wi-Fi
         const wifiCalls = functionCalls.filter(fc => fc.name === 'manage_wifi');
         for (const call of wifiCalls) {
             const { action } = (call.args as any);
             if (onDeviceUpdate) onDeviceUpdate('wifi', action);
             if (!responseText) responseText += `\n(Managing Wi-Fi: ${action})`;
         }

         // Drivers
         const driverCalls = functionCalls.filter(fc => fc.name === 'update_drivers');
         for (const _call of driverCalls) {
             if (onDeviceUpdate) onDeviceUpdate('drivers', 'update');
             if (!responseText) responseText += `\n(Checking for driver updates...)`;
         }

         // Tasks
         const taskCalls = functionCalls.filter(fc => fc.name === 'manage_tasks');
         for (const call of taskCalls) {
             const { action, task_text } = (call.args as any);
             if (onDeviceUpdate) onDeviceUpdate('tasks', action, task_text);
             if (!responseText) responseText += `\n(Task ${action}: ${task_text})`;
         }
         
         // Mood
         const moodCalls = functionCalls.filter(fc => fc.name === 'set_mood');
         for (const call of moodCalls) {
             const { mood } = (call.args as any);
             if (onDeviceUpdate) onDeviceUpdate('mood', mood);
         }

         // Bluetooth
         const btCalls = functionCalls.filter(fc => fc.name === 'scan_bluetooth_devices');
         for (const _call of btCalls) {
             // In text chat, we can't easily trigger the browser popup, but we can instruct the user
             if (!responseText) responseText += `\n(I've initiated the Bluetooth scan protocols. Check your device list.)`;
         }

         // Health
         const healthCalls = functionCalls.filter(fc => fc.name === 'get_health_status');
         for (const call of healthCalls) {
             if (healthMetrics && healthMetrics.isConnected) {
                 const status = `Heart Rate: ${healthMetrics.heartRate} bpm, Steps: ${healthMetrics.steps}, Sleep: ${healthMetrics.sleepHours}h`;
                 if (!responseText) responseText += `\n(I see your vitals: ${status}. You are doing well!)`;
             } else {
                 if (!responseText) responseText += `\n(I can't reach your watch right now, dear.)`;
             }
         }
      }

      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText || "I did that for you, honey.",
        timestamp: Date.now(),
        groundingMetadata: groundingMetadata as any // Store search results
      };
      setMessages(prev => [...prev, modelMsg]);

    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Oh dear, I seem to be having trouble understanding that right now.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsTyping(false);
    }
  }, [chatSession, initChat, onDeviceUpdate, healthMetrics]);

  const generateVideo = useCallback(async (prompt: string) => {
    if (!prompt.trim()) return;

    const msgId = Date.now().toString();
    setMessages(prev => [...prev, {
      id: msgId,
      role: 'model',
      text: `Creating a video for you, my love: "${prompt}"`,
      timestamp: Date.now(),
      isGeneratingVideo: true
    }]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({operation: operation});
      }

      const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (videoUri) {
        const videoRes = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
        const blob = await videoRes.blob();
        const localUrl = URL.createObjectURL(blob);

        setMessages(prev => prev.map(m => {
          if (m.id === msgId) {
            return {
              ...m,
              isGeneratingVideo: false,
              videoUrl: localUrl,
              text: `Here is the video you asked for, sweetie.`
            };
          }
          return m;
        }));
      } else {
        throw new Error("No video returned");
      }

    } catch (e) {
      console.error("Video generation failed", e);
      setMessages(prev => prev.map(m => {
        if (m.id === msgId) {
          return {
            ...m,
            isGeneratingVideo: false,
            text: "I'm sorry honey, I couldn't make that video right now."
          };
        }
        return m;
      }));
    }
  }, []);

  const speakMessage = useCallback(async (text: string) => {
    if (isPlayingAudio || !text) return;
    setIsPlayingAudio(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
         const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
         const audioBuffer = await audioContext.decodeAudioData(decodeBase64(base64Audio).buffer);
         const source = audioContext.createBufferSource();
         source.buffer = audioBuffer;
         source.connect(audioContext.destination);
         source.start();
         source.onended = () => {
             setIsPlayingAudio(false);
             audioContext.close();
         };
      } else {
          setIsPlayingAudio(false);
      }
    } catch (e) {
      console.error("TTS Failed", e);
      setIsPlayingAudio(false);
    }
  }, [isPlayingAudio]);

  const clearChat = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    setChatSession(null);
  }, []);

  return { messages, sendMessage, isTyping, generateVideo, speakMessage, isPlayingAudio, clearChat, modelMode, setMode };
};
