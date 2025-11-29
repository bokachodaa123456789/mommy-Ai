
import { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI, Chat, Type, FunctionDeclaration, Modality } from '@google/genai';
import { Message, Attachment, HealthMetrics } from '../types';
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

const healthTool: FunctionDeclaration = {
  name: "get_health_status",
  description: "Retrieve user's health metrics from smart watch.",
  parameters: { type: Type.OBJECT, properties: {} }
};

const STORAGE_KEY = 'mommy_chat_history';

export const useGeminiChat = (
    onDeviceUpdate?: (id: string, status: string) => void,
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

  // Persist messages whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const initChat = useCallback(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const memoryContext = getSystemMemoryContext();
    
    // We recreate history for the model context if needed, but for now we start fresh session-wise 
    // while keeping UI history. To make the model aware of past chat, we'd need to map `messages` to Content objects.
    // For simplicity in this session-based SDK usage, we just inject memory context.
    
    const newChat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        tools: [{ functionDeclarations: [memoryTool, deviceControlTool, healthTool] }],
        systemInstruction: `You are Mommy, a caring mother figure. 
            ${memoryContext}
            Capabilities:
            - Analyze images/videos.
            - Remember info ('remember_info').
            - Control devices ('control_device').
            - Check health ('get_health_status') if asked about vitals.`,
      },
      history: messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }] // Simplified history reconstruction
      }))
    });
    setChatSession(newChat);
    return newChat;
  }, [messages]); // Re-init if messages loaded initially, though usually we want a stable session.

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
      if (attachments.length > 0) {
        const parts: any[] = [];
        if (text) parts.push({ text });
        attachments.forEach(att => {
          parts.push({ inlineData: { mimeType: att.mimeType, data: att.data } });
        });
        result = await chat!.sendMessage({ message: parts as any });
      } else {
        result = await chat!.sendMessage({ message: text });
      }
      
      let responseText = result.text || "";
      const functionCalls = result.functionCalls;

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
    // Optionally reset chat session context here if needed, but creating a new chat instance in initChat handles it
    setChatSession(null);
  }, []);

  return { messages, sendMessage, isTyping, generateVideo, speakMessage, isPlayingAudio, clearChat };
};
