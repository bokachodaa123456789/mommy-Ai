
import React, { useRef, useEffect, useState } from 'react';
import { Send, Image as ImageIcon, Film, Loader2, Volume2, X, Paperclip, Sparkles, User, MonitorSmartphone, Clock, Globe, Zap, BrainCircuit, ExternalLink } from 'lucide-react';
import { useGeminiChat } from '../hooks/useGeminiChat';
import { fileToBase64, getMimeType, getVideoMetadata } from '../utils/fileUtils';
import { Attachment, SmartDevice, HealthMetrics, ModelMode } from '../types';
import SmartControlPanel from './SmartControlPanel';
import HealthPanel from './HealthPanel';
import HistorySidebar from './HistorySidebar';

interface ChatInterfaceProps {
    devices?: SmartDevice[];
    onDeviceUpdate?: (id: string, action: string) => void;
    healthMetrics?: HealthMetrics;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ devices, onDeviceUpdate, healthMetrics }) => {
  const { messages, sendMessage, isTyping, generateVideo, speakMessage, isPlayingAudio, clearChat, modelMode, setMode } = useGeminiChat(onDeviceUpdate, healthMetrics);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isVideoMode, setIsVideoMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && attachments.length === 0) return;
    if (isTyping) return;

    if (isVideoMode) {
      generateVideo(input);
      setInput("");
      setIsVideoMode(false);
      return;
    }

    await sendMessage(input, attachments);
    setInput("");
    setAttachments([]);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      try {
        const base64 = await fileToBase64(file);
        const mimeType = getMimeType(file);
        const type = mimeType.startsWith('video/') ? 'video' : 'image';
        
        let metadata;
        if (type === 'video') {
            metadata = await getVideoMetadata(file);
        }

        setAttachments(prev => [...prev, {
          type,
          mimeType,
          data: base64,
          url: URL.createObjectURL(file),
          metadata
        }]);
      } catch (err) {
        console.error("File processing failed", err);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const toggleVideoMode = () => {
    setIsVideoMode(!isVideoMode);
    setAttachments([]); 
  };

  return (
    <div className="flex flex-col h-full w-full max-w-lg mx-auto relative z-10">
      {/* Top Bar Actions & Mode Selector */}
      <div className="absolute top-0 left-4 right-4 z-20 flex justify-between items-center pointer-events-none">
         {/* Mode Switcher - Pointer events enabled */}
         <div className="pointer-events-auto bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-full p-1 flex space-x-1 shadow-lg">
            <button 
                onClick={() => setMode('pro')}
                className={`p-1.5 px-3 rounded-full flex items-center space-x-1 transition-all text-[10px] font-bold uppercase tracking-wider ${modelMode === 'pro' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
                <BrainCircuit className="w-3 h-3" />
                <span>Pro</span>
            </button>
            <button 
                onClick={() => setMode('search')}
                className={`p-1.5 px-3 rounded-full flex items-center space-x-1 transition-all text-[10px] font-bold uppercase tracking-wider ${modelMode === 'search' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
                <Globe className="w-3 h-3" />
                <span>Search</span>
            </button>
            <button 
                onClick={() => setMode('fast')}
                className={`p-1.5 px-3 rounded-full flex items-center space-x-1 transition-all text-[10px] font-bold uppercase tracking-wider ${modelMode === 'fast' ? 'bg-yellow-500 text-black shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
                <Zap className="w-3 h-3" />
                <span>Fast</span>
            </button>
         </div>

         <button 
           onClick={() => setShowHistory(true)}
           className="pointer-events-auto p-2 rounded-full bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-pink-300 transition-colors backdrop-blur-md border border-white/5"
           title="History"
         >
           <Clock className="w-4 h-4" />
         </button>
      </div>

      <HistorySidebar 
        isOpen={showHistory} 
        onClose={() => setShowHistory(false)} 
        messages={messages}
        onClear={() => { clearChat(); setShowHistory(false); }}
      />
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6 scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-transparent pt-14">
        {messages.length === 0 && (
          <div className="text-center mt-8 px-6 animate-in fade-in zoom-in duration-700">
            <div className="relative w-20 h-20 mx-auto mb-6">
                 <div className="absolute inset-0 bg-pink-500/20 rounded-full blur-xl animate-pulse"></div>
                 <div className="relative bg-gradient-to-tr from-slate-800 to-slate-900 w-20 h-20 rounded-full flex items-center justify-center border border-white/10 shadow-xl">
                    <Sparkles className="w-8 h-8 text-pink-400" />
                 </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Mommy AI</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              I'm here for you, sweetie. I can search the web, analyze your world, or just chat quickly.
            </p>
            
            <div className="grid grid-cols-2 gap-3 opacity-80">
                <div className="bg-slate-800/40 p-3 rounded-xl border border-white/5 flex flex-col items-center">
                    <MonitorSmartphone className="w-5 h-5 text-purple-400 mb-1" />
                    <span className="text-xs text-slate-300">Smart Control</span>
                </div>
                 <div className="bg-slate-800/40 p-3 rounded-xl border border-white/5 flex flex-col items-center">
                    <Film className="w-5 h-5 text-indigo-400 mb-1" />
                    <span className="text-xs text-slate-300">Veo Video</span>
                </div>
            </div>

            {devices && <div className="mt-8 text-left"><SmartControlPanel devices={devices} /></div>}
            {healthMetrics && <div className="mt-4 text-left"><HealthPanel metrics={healthMetrics} onConnect={() => {}} /></div>}
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}
          >
            <div className="flex items-end max-w-[90%] gap-2">
               
               {msg.role === 'model' && (
                 <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex-shrink-0 flex items-center justify-center shadow-lg shadow-pink-500/20 text-[10px] text-white font-bold">
                    M
                 </div>
               )}

               <div
                className={`p-4 rounded-2xl text-sm leading-relaxed shadow-md backdrop-blur-sm border ${
                    msg.role === 'user'
                    ? 'bg-gradient-to-br from-pink-600 to-purple-700 text-white rounded-br-none border-pink-500/20'
                    : 'bg-slate-800/80 text-slate-100 rounded-bl-none border-slate-700/50'
                }`}
                >
                {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mb-3 space-y-2">
                    {msg.attachments.map((att, i) => (
                        <div key={i} className="rounded-xl overflow-hidden border border-white/10 shadow-sm">
                        {att.type === 'image' ? (
                            <img src={att.url || `data:${att.mimeType};base64,${att.data}`} alt="attachment" className="max-w-full max-h-48 object-cover" />
                        ) : (
                            <div className="relative">
                                <video 
                                src={att.url || `data:${att.mimeType};base64,${att.data}`} 
                                controls 
                                className="max-w-full max-h-64 bg-black" 
                                />
                                {att.metadata && (
                                    <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-[9px] font-mono text-white/80 pointer-events-none">
                                        {att.metadata.width}x{att.metadata.height} | {att.metadata.duration?.toFixed(1)}s
                                    </div>
                                )}
                            </div>
                        )}
                        </div>
                    ))}
                    </div>
                )}

                <p className="whitespace-pre-wrap">{msg.text}</p>

                {/* Grounding Sources */}
                {msg.groundingMetadata?.groundingChunks && msg.groundingMetadata.groundingChunks.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1.5 flex items-center">
                            <Globe className="w-3 h-3 mr-1" />
                            Sources
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {msg.groundingMetadata.groundingChunks.map((chunk, idx) => chunk.web ? (
                                <a 
                                    key={idx}
                                    href={chunk.web.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-1 bg-slate-700/50 hover:bg-slate-700 hover:text-blue-300 transition-colors rounded-md px-2 py-1 text-[10px] text-slate-300 border border-white/5"
                                >
                                    <span className="max-w-[100px] truncate">{chunk.web.title}</span>
                                    <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                                </a>
                            ) : null)}
                        </div>
                    </div>
                )}

                {msg.videoUrl && (
                    <div className="mt-4 rounded-xl overflow-hidden shadow-2xl border border-indigo-500/30 ring-1 ring-indigo-500/20">
                    <video src={msg.videoUrl} controls autoPlay loop className="w-full aspect-video object-cover" />
                    </div>
                )}
                
                {msg.isGeneratingVideo && (
                    <div className="mt-3 flex items-center space-x-3 text-indigo-200 text-xs font-medium bg-indigo-900/30 px-4 py-3 rounded-xl border border-indigo-500/20">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                    <span>Dreaming up your video...</span>
                    </div>
                )}
                </div>

                {msg.role === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center shadow-sm text-slate-400">
                        <User className="w-3 h-3" />
                    </div>
                )}
            </div>
            
            {/* Actions for AI Message */}
            {msg.role === 'model' && !msg.isGeneratingVideo && (
              <div className="ml-10 mt-1 flex space-x-2">
                  <button 
                    onClick={() => speakMessage(msg.text)}
                    disabled={isPlayingAudio}
                    className={`text-xs flex items-center gap-1 transition-colors ${isPlayingAudio ? 'text-pink-400 opacity-100' : 'text-slate-500 hover:text-pink-400 opacity-0 group-hover:opacity-100'}`}
                  >
                    <Volume2 className={`w-3 h-3 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
                  </button>
              </div>
            )}
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start ml-8">
             <div className="bg-slate-800/60 border border-slate-700/50 p-3 rounded-2xl rounded-bl-none flex space-x-1.5 items-center backdrop-blur-sm">
              <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${modelMode === 'fast' ? 'bg-yellow-400' : modelMode === 'search' ? 'bg-blue-400' : 'bg-pink-400'}`} />
              <div className={`w-1.5 h-1.5 rounded-full animate-bounce delay-75 ${modelMode === 'fast' ? 'bg-yellow-400' : modelMode === 'search' ? 'bg-blue-400' : 'bg-pink-400'}`} />
              <div className={`w-1.5 h-1.5 rounded-full animate-bounce delay-150 ${modelMode === 'fast' ? 'bg-yellow-400' : modelMode === 'search' ? 'bg-blue-400' : 'bg-pink-400'}`} />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      
      {/* Input Area Floating Pill */}
      <div className="p-4 relative">
         {/* Attachment Preview */}
        {attachments.length > 0 && (
          <div className="absolute bottom-full left-4 mb-2 flex space-x-2 animate-in slide-in-from-bottom-2 fade-in">
            {attachments.map((att, i) => (
              <div key={i} className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/20 shadow-lg bg-black">
                {att.type === 'image' ? (
                  <img src={att.url} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <video src={att.url} className="w-full h-full object-cover opacity-60" />
                )}
                <button 
                  onClick={() => removeAttachment(i)}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/60 transition-colors text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className={`
             flex items-center gap-2 p-1.5 rounded-[24px] border backdrop-blur-xl shadow-2xl transition-all duration-300
             ${isVideoMode 
                ? 'bg-indigo-950/80 border-indigo-500/50 shadow-indigo-500/10' 
                : 'bg-slate-900/80 border-white/10 shadow-black/20'
              }
        `}>
           {/* Mode Toggle & Attach */}
           <div className="flex items-center pl-1">
               <button
                 type="button"
                 onClick={() => fileInputRef.current?.click()}
                 className={`p-2 rounded-full transition-all ${isVideoMode ? 'text-indigo-300 hover:bg-indigo-900' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                 disabled={isVideoMode}
               >
                 <Paperclip className="w-5 h-5" />
               </button>
               
               <button
                 type="button"
                 onClick={toggleVideoMode}
                 className={`p-2 rounded-full transition-all ml-1 ${
                   isVideoMode 
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/40' 
                    : 'text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10'
                 }`}
                 title="Veo Video Mode"
               >
                 <Film className="w-5 h-5" />
               </button>
           </div>

           <input 
             type="file" 
             ref={fileInputRef} 
             onChange={handleFileSelect} 
             className="hidden" 
             accept="image/*,video/*"
           />

           <form onSubmit={handleSubmit} className="flex-1 flex items-center">
             <input
               type="text"
               value={input}
               onChange={(e) => setInput(e.target.value)}
               placeholder={isVideoMode ? "Describe the video you want..." : `Message Mommy (${modelMode})...`}
               className={`w-full bg-transparent border-0 focus:ring-0 text-white placeholder-slate-500 px-2 py-2.5 focus:outline-none text-sm font-medium ${
                 isVideoMode ? 'placeholder-indigo-300/50' : ''
               }`}
             />
             <button
               type="submit"
               disabled={(!input.trim() && attachments.length === 0) || isTyping}
               className={`p-2.5 rounded-full text-white transition-all transform active:scale-95 shadow-lg mr-1 ${
                 isVideoMode 
                  ? 'bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 shadow-indigo-500/25' 
                  : modelMode === 'search'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 shadow-blue-500/25'
                  : modelMode === 'fast'
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 shadow-yellow-500/25 text-black'
                  : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 shadow-pink-500/25'
               } disabled:opacity-50 disabled:cursor-not-allowed`}
             >
               {isVideoMode ? <Sparkles className="w-4 h-4" /> : <Send className="w-4 h-4 ml-0.5" />}
             </button>
           </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
