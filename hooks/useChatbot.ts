/**
 * Custom hook for managing chatbot state and operations
 * Includes localStorage persistence for multiple chat sessions
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { ChatbotClient, ChatResponse, ChatMessage as ChatMessageType } from "@/lib/chatbot";

export interface UseChatbotOptions {
  userId: string;
  onError?: (error: string) => void;
}

// Chat session type
export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessageType[];
  createdAt: string;
  updatedAt: string;
}

// Processing step types for showing LLM progress
export type ProcessingStep = 
  | "idle"
  | "analyzing"      // กำลังวิเคราะห์คำถาม
  | "searching"      // กำลังค้นหาด้วย Hybrid RAG (semantic + graph)
  | "fetching"       // กำลังดึงข้อมูล context
  | "extracting"     // กำลัง extract vulnerability data
  | "generating"     // กำลังสร้างคำตอบ
  | "finalizing";    // กำลังสรุปผล

export interface ProcessingState {
  step: ProcessingStep;
  message: string;
  progress?: number; // 0-100
}

const STEP_MESSAGES: Record<ProcessingStep, string> = {
  idle: "",
  analyzing: "กำลังวิเคราะห์คำถาม...",
  searching: "กำลังค้นหาด้วย Hybrid RAG...",
  fetching: "กำลังดึงข้อมูลจาก Knowledge Graph...",
  extracting: "กำลัง Extract ข้อมูล Vulnerability...",
  generating: "กำลังสร้างคำตอบ...",
  finalizing: "กำลังสรุปผลลัพธ์...",
};

// LocalStorage keys
const CHAT_SESSIONS_KEY = "chatbot_sessions";
const CURRENT_SESSION_KEY = "chatbot_current_session";
const MAX_SESSIONS = 20;

// Helper functions for localStorage
function isClient(): boolean {
  return typeof globalThis.window !== "undefined";
}

function loadSessions(userId: string): ChatSession[] {
  if (!isClient()) return [];
  
  try {
    const stored = localStorage.getItem(`${CHAT_SESSIONS_KEY}_${userId}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Failed to load chat sessions:", error);
  }
  return [];
}

function saveSessions(userId: string, sessions: ChatSession[]): void {
  if (!isClient()) return;
  
  try {
    // Keep only last MAX_SESSIONS
    const trimmed = sessions.slice(0, MAX_SESSIONS);
    localStorage.setItem(`${CHAT_SESSIONS_KEY}_${userId}`, JSON.stringify(trimmed));
  } catch (error) {
    console.error("Failed to save chat sessions:", error);
  }
}

function loadCurrentSessionId(userId: string): string | null {
  if (!isClient()) return null;
  
  try {
    return localStorage.getItem(`${CURRENT_SESSION_KEY}_${userId}`);
  } catch (error) {
    return null;
  }
}

function saveCurrentSessionId(userId: string, sessionId: string): void {
  if (!isClient()) return;
  
  try {
    localStorage.setItem(`${CURRENT_SESSION_KEY}_${userId}`, sessionId);
  } catch (error) {
    console.error("Failed to save current session ID:", error);
  }
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function generateTitle(messages: ChatMessageType[]): string {
  const firstUserMsg = messages.find(m => m.role === "user");
  if (firstUserMsg) {
    return firstUserMsg.content.substring(0, 40) + (firstUserMsg.content.length > 40 ? "..." : "");
  }
  return "New Chat";
}

export function useChatbot({ userId, onError }: UseChatbotOptions) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatbotReady, setChatbotReady] = useState(false);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    step: "idle",
    message: "",
  });
  const clientRef = useRef<ChatbotClient | null>(null);
  const isInitialized = useRef(false);

  // Helper to update processing step
  const setProcessingStep = useCallback((step: ProcessingStep, customMessage?: string) => {
    setProcessingState({
      step,
      message: customMessage || STEP_MESSAGES[step],
    });
  }, []);

  // Load sessions on mount
  useEffect(() => {
    if (!isInitialized.current && userId) {
      const savedSessions = loadSessions(userId);
      setSessions(savedSessions);
      
      // Start with a new chat by default (no loading previous session)
      startNewChat();
      
      isInitialized.current = true;
    }
  }, [userId]);

  // Save current session whenever messages change
  useEffect(() => {
    if (isInitialized.current && currentSessionId && messages.length > 0) {
      setSessions(prev => {
        const existing = prev.find(s => s.id === currentSessionId);
        if (existing) {
          const updated = prev.map(s => 
            s.id === currentSessionId 
              ? { ...s, messages, title: generateTitle(messages), updatedAt: new Date().toISOString() }
              : s
          );
          saveSessions(userId, updated);
          return updated;
        } else {
          const newSession: ChatSession = {
            id: currentSessionId,
            title: generateTitle(messages),
            messages,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          const updated = [newSession, ...prev];
          saveSessions(userId, updated);
          return updated;
        }
      });
    }
  }, [messages, currentSessionId, userId]);

  // Initialize chatbot client
  const initializeChatbot = useCallback(() => {
    try {
      const client = new ChatbotClient(userId);
      clientRef.current = client;
      setChatbotReady(true);
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to initialize chatbot";
      setError(errorMsg);
      onError?.(errorMsg);
      setChatbotReady(false);
    }
  }, [userId, onError]);

  // Auto-initialize on mount
  useEffect(() => {
    initializeChatbot();
  }, [initializeChatbot]);

  // Start a new chat session
  const startNewChat = useCallback(() => {
    const newId = generateSessionId();
    setCurrentSessionId(newId);
    setMessages([]);
    setError(null);
    saveCurrentSessionId(userId, newId);
    
    // Reset chatbot client for new conversation
    if (clientRef.current) {
      clientRef.current = new ChatbotClient(userId);
    }
    
    console.log("🆕 Started new chat session:", newId);
  }, [userId]);

  // Load a specific chat session
  const loadSession = useCallback((sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setMessages(session.messages);
      saveCurrentSessionId(userId, sessionId);
      console.log("📥 Loaded chat session:", sessionId);
    }
  }, [sessions, userId]);

  // Delete a chat session
  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== sessionId);
      saveSessions(userId, updated);
      return updated;
    });
    
    // If deleting current session, start new chat
    if (sessionId === currentSessionId) {
      startNewChat();
    }
  }, [currentSessionId, userId, startNewChat]);

  // Send message with streaming response
  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || !clientRef.current || loading) {
        return;
      }

      const userMessage = message.trim();
      setInput("");
      setLoading(true);
      setError(null);

      try {
        // Step 1: Add user message immediately
        setProcessingStep("analyzing");
        
        const userMsg: ChatMessageType = {
          id: `msg_${Date.now()}`,
          role: "user",
          content: userMessage,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMsg]);

        // Step 2: Show searching step briefly
        setProcessingStep("searching");
        await new Promise(resolve => setTimeout(resolve, 300));

        // Step 3: Start generating (streaming)
        setProcessingStep("generating");

        // Create placeholder for streaming response
        const assistantMsgId = `msg_${Date.now() + 1}`;
        let streamedContent = "";
        
        // Add empty assistant message that will be updated
        setMessages((prev) => [...prev, {
          id: assistantMsgId,
          role: "assistant",
          content: "",
          created_at: new Date().toISOString(),
        }]);

        // Stream the response
        await clientRef.current.sendMessageStream(
          userMessage,
          // onToken - update message content progressively
          (token: string) => {
            streamedContent += token;
            setMessages((prev) => 
              prev.map((msg) => 
                msg.id === assistantMsgId 
                  ? { ...msg, content: streamedContent }
                  : msg
              )
            );
          },
          // onComplete - finalize
          () => {
            setProcessingStep("finalizing");
          },
          // onError
          (errorMsg: string) => {
            setError(errorMsg);
            onError?.(errorMsg);
          }
        );

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to send message";
        setError(errorMsg);
        onError?.(errorMsg);
      } finally {
        setLoading(false);
        setProcessingStep("idle");
      }
    },
    [loading, onError, setProcessingStep]
  );

  // Clear current messages (keeps session in history)
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setProcessingStep("idle");
  }, [setProcessingStep]);

  // Delete all sessions
  const clearAllSessions = useCallback(() => {
    setSessions([]);
    if (isClient()) {
      localStorage.removeItem(`${CHAT_SESSIONS_KEY}_${userId}`);
      localStorage.removeItem(`${CURRENT_SESSION_KEY}_${userId}`);
    }
    startNewChat();
    console.log("🗑️ All chat sessions cleared");
  }, [userId, startNewChat]);

  // Reset chatbot
  const reset = useCallback(() => {
    clearMessages();
    initializeChatbot();
  }, [clearMessages, initializeChatbot]);

  // Get current session
  const currentSession = sessions.find(s => s.id === currentSessionId);

  return {
    // Current chat state
    messages,
    input,
    setInput,
    loading,
    error,
    chatbotReady,
    sendMessage,
    clearMessages,
    reset,
    
    // Session management
    sessions,
    currentSessionId,
    currentSession,
    startNewChat,
    loadSession,
    deleteSession,
    clearAllSessions,
    
    // Processing state
    processingState,
    processingStep: processingState.step,
    processingMessage: processingState.message,
    
    // Chat history info
    hasStoredHistory: sessions.length > 0,
    sessionCount: sessions.length,
  };
}
