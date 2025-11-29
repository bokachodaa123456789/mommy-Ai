
import { Memory } from '../types';

const MEMORY_KEY = 'mommy_memory_store';

export const getMemories = (): Memory[] => {
  try {
    const stored = localStorage.getItem(MEMORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load memories", e);
    return [];
  }
};

export const addMemory = (content: string): Memory => {
  const memories = getMemories();
  const newMemory: Memory = {
    id: Date.now().toString(),
    content,
    timestamp: Date.now(),
  };
  
  // Keep last 50 memories to prevent context overflow
  const updated = [...memories, newMemory].slice(-50);
  localStorage.setItem(MEMORY_KEY, JSON.stringify(updated));
  return newMemory;
};

export const clearMemories = () => {
  localStorage.removeItem(MEMORY_KEY);
};

export const getSystemMemoryContext = (): string => {
  const memories = getMemories();
  if (memories.length === 0) return "";
  
  return `
IMPORTANT - LONG TERM MEMORY:
You have access to the following facts you have learned about the user from previous conversations. Use them to personalize your responses and show you care.
${memories.map(m => `- ${m.content}`).join('\n')}
`;
};
