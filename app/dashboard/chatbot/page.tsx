"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader, MessageCircle, Copy, Check } from "lucide-react";
import { ChatbotClient, ChatResponse, ChatMessage as ChatMessageType } from "@/lib/chatbot";
import { AuthService } from "@/lib/auth";
export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatbotReady, setChatbotReady] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<ChatbotClient | null>(null);

  // Initialize
  useEffect(() => {
    const initChatbot = async () => {
      try {
        const user = await AuthService.getCurrentUser();
        if (user?.id) {
          const client = new ChatbotClient(user.id);
          clientRef.current = client;
          setChatbotReady(true);
          setError(null);
        }
      } catch (err) {
        console.error("Failed to initialize chatbot:", err);
        setError("Failed to initialize chatbot. Please try again.");
        setChatbotReady(false);
      }
    };

    initChatbot();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || !clientRef.current || loading) {
      return;
    }

    const userMessage = input.trim();
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

      // Send message
      const response: ChatResponse = await clientRef.current.sendMessage(userMessage);

      // Add assistant response
      const assistantMsg: ChatMessageType = {
        id: `msg_${Date.now() + 1}`,
        role: "assistant",
        content: response.assistant_response,
        created_at: response.timestamp,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">AI Assistant</h1>
        <p className="text-base-content/60">Ask questions about your dependencies and vulnerabilities</p>
      </div>

      {/* Chat Container */}
      <div className="flex flex-col gap-4 rounded-lg border border-base-300 bg-base-100 shadow-md overflow-hidden h-[600px]">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && !error && (
            <div className="flex h-full items-center justify-center text-center">
              <div>
                <MessageCircle className="mx-auto mb-4 h-12 w-12 opacity-30" />
                <h3 className="mb-2 text-lg font-semibold">Welcome to AI Assistant</h3>
                <p className="text-base-content/60 max-w-xs">
                  Ask me anything about your project dependencies, vulnerabilities, or security concerns.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div role="alert" className="alert alert-error">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`group relative max-w-lg rounded-lg px-4 py-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-content"
                    : "bg-base-200 text-base-content"
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </p>
                <button
                  onClick={() => copyToClipboard(message.content, message.id)}
                  className="absolute -right-10 top-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-base-300 rounded"
                  title="Copy message"
                >
                  {copiedId === message.id ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-lg bg-base-200 px-4 py-3">
                <Loader className="h-4 w-4 animate-spin" />
                <span className="text-sm">AI is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form
          onSubmit={handleSendMessage}
          className="border-t border-base-300 bg-base-100 p-4"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about dependencies, vulnerabilities, or security..."
              disabled={!chatbotReady || loading}
              className="input input-bordered flex-1"
            />
            <button
              type="submit"
              disabled={!chatbotReady || loading || !input.trim()}
              className="btn btn-primary"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          {!chatbotReady && (
            <p className="text-xs text-base-content/60 mt-2">
              Initializing chatbot...
            </p>
          )}
        </form>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-base-200 shadow-sm">
          <div className="card-body">
            <h3 className="card-title text-base">💡 Tips</h3>
            <ul className="text-sm space-y-1 text-base-content/80">
              <li>• Ask about specific vulnerabilities</li>
              <li>• Get mitigation strategies</li>
              <li>• Learn about dependencies</li>
            </ul>
          </div>
        </div>

        <div className="card bg-base-200 shadow-sm">
          <div className="card-body">
            <h3 className="card-title text-base">🔍 Examples</h3>
            <ul className="text-sm space-y-1 text-base-content/80">
              <li>• "What is XSS?"</li>
              <li>• "How to prevent SQL injection?"</li>
              <li>• "Explain CORS"</li>
            </ul>
          </div>
        </div>

        <div className="card bg-base-200 shadow-sm">
          <div className="card-body">
            <h3 className="card-title text-base">⚡ Features</h3>
            <ul className="text-sm space-y-1 text-base-content/80">
              <li>• Entity extraction</li>
              <li>• Context awareness</li>
              <li>• Knowledge graph integration</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
