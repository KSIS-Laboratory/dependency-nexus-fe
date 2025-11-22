"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, X, MessageCircle, Copy, Check, Trash2 } from "lucide-react";
import { useChatbot } from "@/hooks/useChatbot";

interface ChatbotWidgetProps {
  readonly userId: string;
}

export function ChatbotWidget({ userId }: Readonly<ChatbotWidgetProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const handleChatbotError = useCallback((err: string) => {
    console.error("Chatbot error:", err);
  }, []);
  
  const {
    messages,
    input,
    setInput,
    loading,
    error,
    chatbotReady,
    sendMessage,
    clearMessages,
  } = useChatbot({
    userId,
    onError: handleChatbotError,
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const target = globalThis.window ?? null;
    if (!target) {
      return;
    }

    const handleContextEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string; autoSend?: boolean }>;
      const contextMessage = customEvent.detail?.message?.trim();

      if (!contextMessage) {
        return;
      }

      setIsOpen(true);

      if (customEvent.detail?.autoSend ?? true) {
        void sendMessage(contextMessage);
      } else {
        setInput(contextMessage);
      }
    };

    target.addEventListener("chatbot:context", handleContextEvent as EventListener);
    return () => {
      target.removeEventListener("chatbot:context", handleContextEvent as EventListener);
    };
  }, [sendMessage, setInput]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(input);
  };

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleClearHistory = useCallback(() => {
    clearMessages();
    setInput("");
    setCopiedId(null);
  }, [clearMessages]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
      }
    };

    const handlePointerDown = (event: MouseEvent) => {
      if (!modalRef.current) {
        return;
      }

      if (!modalRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [handleClose, isOpen]);

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
        <dialog className="modal" open>
          <div
            ref={modalRef}
            aria-modal="true"
            tabIndex={-1}
            className="modal-box h-230 max-w-2xl w-full p-0 bg-base-100 flex flex-col rounded-3xl shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-base-200 px-6 py-4 bg-base-100 rounded-t-3xl">
              <div>
                <p className="text-xs uppercase tracking-wide text-base-content/60">AI Assistant</p>
                <h2 className="text-lg font-semibold text-primary">Dependency & Security Advisor</h2>
                <p className="text-xs text-base-content/60">Powered by Llama 3.1</p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="btn btn-outline btn-circle btn-error"
                  disabled={messages.length === 0}
                  aria-label="Clear"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
                <button
                  onClick={handleClose}
                  className="btn btn-outline btn-circle btn-error"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-base-200/40">
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

              {messages.map((message) => {
                const isUser = message.role === "user";
                return (
                  <div
                    key={message.id}
                    className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {!isUser && (
                      <div className="mr-3 mt-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <MessageCircle className="h-4 w-4" />
                      </div>
                    )}
                    <div className={`group relative max-w-3xl w-full rounded-2xl border ${
                      isUser
                        ? "bg-primary/30 text-primary-content border-primary/30"
                        : "bg-base-100 border-base-300"
                    } p-4 shadow-sm transition hover:shadow-md`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap wrap-break-words text-base-content">
                        {message.content}
                      </p>
                      <button
                        onClick={() => copyToClipboard(message.content, message.id)}
                        className="absolute -right-2 -top-2 hidden bg-base-100/90 p-1 text-base-content/70 shadow group-hover:flex btn btn-circle btn-sm btn-ghost"
                        title="Copy message"
                      >
                        {copiedId === message.id ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex items-center gap-2 text-sm text-base-content/70">
                  <span className="loading loading-dots loading-sm" />
                  <span>กำลังคิด...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="border-t border-base-200 p-4">
              <div className="flex flex-col gap-3">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="ถามเกี่ยวกับ dependencies, vulnerabilities หรือ security guidance..."
                  disabled={!chatbotReady || loading}
                  className="textarea textarea-bordered min-h-20 w-full resize-none text-base-content/90"
                />
                <div className="flex items-center justify-between text-xs text-base-content/60">
                  <span>{chatbotReady ? "พร้อมตอบทุกคำถาม" : "กำลังเตรียมตัว..."}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setInput("")}
                      disabled={!input}
                    >
                      ล้างข้อความ
                    </button>
                    <button
                      type="submit"
                      disabled={!chatbotReady || loading || !input.trim()}
                      className="btn btn-primary"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </dialog>
      )}
    </>
  );
}
