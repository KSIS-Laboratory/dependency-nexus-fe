/**
 * Custom hook for managing chatbot state and operations
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { ChatbotClient, ChatResponse, ChatMessage as ChatMessageType } from "@/lib/chatbot";

export interface UseChatbotOptions {
  userId: string;
  onError?: (error: string) => void;
}

export function useChatbot({ userId, onError }: UseChatbotOptions) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatbotReady, setChatbotReady] = useState(false);
  const clientRef = useRef<ChatbotClient | null>(null);

  // Initialize chatbot
  const initializeChatbot = useCallback(async () => {
    try {
      const client = new ChatbotClient(userId);
      await client.createConversation();
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

  // Send message
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
        // Add user message
        const userMsg: ChatMessageType = {
          id: `msg_${Date.now()}`,
          role: "user",
          content: userMessage,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMsg]);

        // Send to chatbot
        const response: ChatResponse = await clientRef.current.sendMessage(userMessage);

        // Add assistant response
        const assistantMsg: ChatMessageType = {
          id: `msg_${Date.now() + 1}`,
          role: "assistant",
          content: response.assistant_response,
          created_at: response.timestamp,
          entities: response.response_entities,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to send message";
        setError(errorMsg);
        onError?.(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [loading, onError]
  );

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  // Reset chatbot
  const reset = useCallback(async () => {
    clearMessages();
    await initializeChatbot();
  }, [clearMessages, initializeChatbot]);

  return {
    messages,
    input,
    setInput,
    loading,
    error,
    chatbotReady,
    sendMessage,
    clearMessages,
    reset,
    conversationId: clientRef.current?.getConversationId() || null,
  };
}
