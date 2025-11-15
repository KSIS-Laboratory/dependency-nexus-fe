"use client";

import { useState, useRef, useEffect } from "react";
import { Send, X, MessageCircle, Loader, Copy, Check } from "lucide-react";
import { useChatbot } from "@/hooks/useChatbot";

interface ChatbotWidgetProps {
  userId: string;
}

export function ChatbotWidget({ userId }: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    input,
    setInput,
    loading,
    error,
    chatbotReady,
    sendMessage,
  } = useChatbot({
    userId,
    onError: (err) => console.error("Chatbot error:", err),
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(input);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="btn btn-circle btn-lg fixed bottom-6 right-6 z-40 bg-linear-to-br from-primary to-secondary shadow-2xl hover:shadow-primary/50 hover:scale-110 active:scale-95 transition-all border-none"
        aria-label="Open AI Assistant"
      >
        <MessageCircle className="h-7 w-7 text-primary-content" />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div
          className="modal modal-open"
          onClick={handleClose}
        >
          <div className="modal-backdrop bg-black/50 backdrop-blur-sm" />
        </div>
      )}

      {/* Chat Modal */}
      {isOpen && (
        <div className="modal modal-open" onClick={(e) => e.stopPropagation()}>
          <div className="modal-box h-[600px] max-w-md p-0 bg-base-100 flex flex-col rounded-2xl">
            {/* Header */}
            <div className="navbar bg-linear-to-r from-primary to-secondary text-primary-content ">
              <div className="flex-1 gap-3">
                <div>
                  <h2 className="font-bold text-lg">AI Assistant</h2>
                  <p className="text-xs opacity-80">Powered by Llama 3.1</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="btn btn-ghost btn-sm btn-circle"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-base-200/30">
              {messages.length === 0 && !error && (
                <div className="hero h-full">
                  <div className="hero-content text-center">
                    <div className="max-w-md space-y-4">
                      <div className="avatar placeholder">
                        <div className="bg-primary/20 text-primary rounded-2xl w-16 flex items-center justify-center">
                          <MessageCircle className="h-8 w-8 animate-pulse" />
                        </div>
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-primary">
                          {chatbotReady ? "สวัสดี! 👋" : "กำลังเตรียมตัว..."}
                        </h1>
                        <p className="py-2 text-base-content/70">
                          {chatbotReady
                            ? "ถามเกี่ยวกับ dependencies และ vulnerabilities ได้เลย"
                            : "Initializing chatbot..."}
                        </p>
                      </div>
                      {chatbotReady && (
                        <div className="flex gap-2 justify-center">
                          <span className="badge badge-primary badge-outline">CVE</span>
                          <span className="badge badge-secondary badge-outline">Dependencies</span>
                          <span className="badge badge-accent badge-outline">Security</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="alert alert-error">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {messages.map((message) => (
                <div key={message.id} className={`chat ${message.role === "user" ? "chat-end" : "chat-start"}`}>
                  {message.role === "assistant" && (
                    <div className="chat-image avatar">
                      <div className="w-10 rounded-full bg-linear-to-r from-primary to-secondary">
                        <div className="flex h-full items-center justify-center">
                          <MessageCircle className="h-5 w-5 text-primary-content" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className={`chat-bubble ${
                    message.role === "user" 
                      ? "chat-bubble-primary" 
                      : "chat-bubble-secondary"
                  }`}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.entities && message.entities.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {message.entities.map((entity, idx) => (
                          <span key={idx} className="badge badge-sm badge-outline">
                            {entity.name} <span className="opacity-60">({entity.type})</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="chat-footer opacity-50">
                    <button
                      onClick={() => copyToClipboard(message.content, message.id)}
                      className="btn btn-ghost btn-xs"
                      title="Copy"
                    >
                      {copiedId === message.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="chat chat-start">
                  <div className="chat-image avatar">
                    <div className="w-10 rounded-full bg-linear-to-r from-primary to-secondary">
                      <div className="flex h-full items-center justify-center">
                        <MessageCircle className="h-5 w-5 text-primary-content" />
                      </div>
                    </div>
                  </div>
                  <div className="chat-bubble chat-bubble-secondary flex items-center gap-2">
                    <span className="loading loading-dots loading-sm"></span>
                    <span>กำลังคิด...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-5 border-t">
              <div className="join w-full">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="ถามเกี่ยวกับ dependencies..."
                  disabled={!chatbotReady || loading}
                  className="input input-bordered join-item flex-1 text-base-content"
                />
                <button
                  type="submit"
                  disabled={!chatbotReady || loading || !input.trim()}
                  className="btn btn-primary join-item"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
              {!chatbotReady && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="loading loading-spinner loading-xs"></span>
                  <p className="text-xs opacity-60">กำลังเตรียมตัว...</p>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
