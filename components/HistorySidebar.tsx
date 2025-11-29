
import React from 'react';
import { X, MessageSquare, Trash2, Clock } from 'lucide-react';
import { Message } from '../types';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  onClear: () => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ isOpen, onClose, messages, onClear }) => {
  // Group messages into query-response pairs
  const historyItems: { query: Message; response?: Message }[] = [];
  
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role === 'user') {
      const query = messages[i];
      // Find the next model message
      let response: Message | undefined;
      if (i + 1 < messages.length && messages[i+1].role === 'model') {
        response = messages[i+1];
      }
      historyItems.push({ query, response });
    }
  }

  // Reverse to show newest first
  const reversedHistory = [...historyItems].reverse();

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div 
        className={`fixed inset-y-0 right-0 w-80 bg-slate-900/90 backdrop-blur-2xl border-l border-white/10 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/10">
            <div className="flex items-center space-x-2 text-white">
              <Clock className="w-5 h-5 text-pink-400" />
              <h2 className="font-bold text-lg">History</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
            {reversedHistory.length === 0 ? (
              <div className="text-center text-slate-500 mt-10">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No history yet.</p>
              </div>
            ) : (
              reversedHistory.map((item) => (
                <div key={item.query.id} className="bg-slate-800/50 rounded-xl p-3 border border-white/5 hover:border-pink-500/20 transition-colors group">
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(item.query.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  {/* Query */}
                  <p className="text-sm text-white font-medium mb-2 line-clamp-2">
                    {item.query.text || (item.query.attachments?.length ? '[Attachment]' : '')}
                  </p>
                  
                  {/* Response Snippet */}
                  {item.response && (
                    <div className="pl-2 border-l-2 border-slate-700">
                      <p className="text-xs text-slate-400 line-clamp-3">
                        {item.response.text}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={onClear}
              className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear History</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default HistorySidebar;
