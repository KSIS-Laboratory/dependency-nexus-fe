"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, X, MessageCircle, Copy, Check, Trash2, ChevronDown, ChevronRight,
  Brain, Database, Loader2, CheckCircle2, Search, FileJson,
  Plus, History
} from "lucide-react";
import { useChatbot, ProcessingStep } from "@/hooks/useChatbot";

/**
 * Component to render batched vulnerability analysis responses
 * Parses sections marked with "--- ส่วนที่ X ---" and displays them as collapsible sections
 */
function BatchedMessageContent({ content }: Readonly<{ content: string }>) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));

  // Check if this is a batched response (contains section markers)
  const isBatchedResponse = content.includes("--- ส่วนที่");

  if (!isBatchedResponse) {
    // Regular message - render as-is
    return (
      <p className="text-sm leading-relaxed whitespace-pre-wrap wrap-break-word text-base-content/60">
        {content}
      </p>
    );
  }

  // Parse batched response into sections
  const parts = content.split(/---\s*ส่วนที่\s*(\d+)\s*---/);
  const sections: { header: string | null; content: string }[] = [];

  // First part is the header (before any section markers)
  if (parts[0].trim()) {
    sections.push({ header: null, content: parts[0].trim() });
  }

  // Parse remaining parts (number, content pairs)
  for (let i = 1; i < parts.length; i += 2) {
    const sectionNum = parts[i];
    const sectionContent = parts[i + 1]?.trim() || "";
    if (sectionContent) {
      sections.push({ header: `ส่วนที่ ${sectionNum}`, content: sectionContent });
    }
  }

  const toggleSection = (idx: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedSections(new Set(sections.map((_, i) => i)));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  return (
    <div className="space-y-3">
      {/* Header section (summary) */}
      {sections[0]?.header === null && (
        <div className="pb-2 border-b border-base-content/10">
          <p className="text-sm leading-relaxed whitespace-pre-wrap wrap-break-word text-base-content/80 font-medium">
            {sections[0].content}
          </p>
        </div>
      )}

      {/* Expand/Collapse controls */}
      {sections.length > 2 && (
        <div className="flex gap-2 text-xs">
          <button
            onClick={expandAll}
            className="btn btn-ghost btn-xs text-primary"
          >
            ขยายทั้งหมด
          </button>
          <button
            onClick={collapseAll}
            className="btn btn-ghost btn-xs text-primary"
          >
            ยุบทั้งหมด
          </button>
        </div>
      )}

      {/* Collapsible sections */}
      {sections.slice(sections[0]?.header === null ? 1 : 0).map((section, idx) => {
        const actualIdx = sections[0]?.header === null ? idx + 1 : idx;
        const isExpanded = expandedSections.has(actualIdx);

        return (
          <div
            key={actualIdx}
            className="border border-base-content/10 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggleSection(actualIdx)}
              className="w-full flex items-center justify-between p-3 bg-base-200/50 hover:bg-base-200 transition-colors text-left"
            >
              <span className="text-sm font-medium text-base-content/80 flex items-center gap-2">
                <span className="badge badge-primary badge-sm">{section.header}</span>
              </span>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-base-content/50" />
              ) : (
                <ChevronRight className="h-4 w-4 text-base-content/50" />
              )}
            </button>

            {isExpanded && (
              <div className="p-3 bg-base-100">
                <p className="text-sm leading-relaxed whitespace-pre-wrap wrap-break-word text-base-content/60">
                  {section.content}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Component to show LLM processing steps with visual indicators
 */
interface ProcessingStepsIndicatorProps {
  currentStep: ProcessingStep;
  message: string;
}

const PROCESSING_STEPS: { step: ProcessingStep; label: string; icon: React.ReactNode }[] = [
  { step: "analyzing", label: "วิเคราะห์", icon: <Search className="h-3.5 w-3.5" /> },
  { step: "searching", label: "Hybrid RAG", icon: <Database className="h-3.5 w-3.5" /> },
  { step: "extracting", label: "Extract", icon: <FileJson className="h-3.5 w-3.5" /> },
  { step: "fetching", label: "ดึงข้อมูล", icon: <Brain className="h-3.5 w-3.5" /> },
  { step: "generating", label: "สร้างคำตอบ", icon: <Brain className="h-3.5 w-3.5" /> },
  { step: "finalizing", label: "สรุป", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
];

function ProcessingStepsIndicator({ currentStep, message }: Readonly<ProcessingStepsIndicatorProps>) {
  const currentIndex = PROCESSING_STEPS.findIndex((s) => s.step === currentStep);

  return (
    <div className="flex flex-col gap-3 p-4 bg-base-200/50 rounded-xl border border-base-content/10">
      {/* Current step message */}
      <div className="flex items-center gap-2 text-sm text-primary font-medium">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{message || "กำลังประมวลผล..."}</span>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-1">
        {PROCESSING_STEPS.map((stepInfo, index) => {
          const isActive = stepInfo.step === currentStep;
          const isCompleted = currentIndex > index;
          const isPending = currentIndex < index;

          return (
            <div key={stepInfo.step} className="flex items-center">
              {/* Step badge */}
              <div
                className={`
                  flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all duration-300
                  ${isActive ? "bg-primary text-primary-content scale-105 shadow-md" : ""}
                  ${isCompleted ? "bg-success/20 text-success" : ""}
                  ${isPending ? "bg-base-300 text-base-content/40" : ""}
                `}
              >
                {/* Step icon based on state */}
                {isCompleted && <Check className="h-3 w-3" />}
                {isActive && <span className="animate-pulse">{stepInfo.icon}</span>}
                {isPending && stepInfo.icon}
                <span className="hidden sm:inline">{stepInfo.label}</span>
              </div>

              {/* Connector line */}
              {index < PROCESSING_STEPS.length - 1 && (
                <div
                  className={`w-4 h-0.5 mx-0.5 transition-colors duration-300 ${isCompleted ? "bg-success" : "bg-base-300"
                    }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ChatbotWidgetProps {
  readonly userId: string;
}

export function ChatbotWidget({ userId }: Readonly<ChatbotWidgetProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
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
    processingStep,
    processingMessage,
    // Session management
    sessions,
    currentSessionId,
    startNewChat,
    loadSession,
    deleteSession,
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
        className="btn btn-circle btn-lg fixed bottom-6 right-6 z-40 bg-linear-to-br from-base-content/10 to-base-content/10 shadow-2xl hover:shadow-base-content/50 hover:scale-110 active:scale-95 transition-all border-none"
        aria-label="Open AI Assistant"
      >
        <MessageCircle className="h-7 w-7 text-white" />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <dialog className="modal" open>
          <div
            ref={modalRef}
            aria-modal="true"
            tabIndex={-1}
            className="modal-box h-230 max-w-2xl w-full p-0 liquid-glass-modal flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-theme px-6 py-4 bg-theme-secondary rounded-t-3xl">
              <div className="flex items-center gap-3">
                {/* History toggle */}
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className={`btn btn-circle btn-sm ${showHistory ? 'btn-primary' : 'btn-ghost'}`}
                  aria-label="Toggle history"
                  title="ประวัติการสนทนา"
                >
                  <History className="h-4 w-4" />
                </button>
                <div>
                  <p className="text-xs uppercase tracking-wide text-theme-muted">AI Assistant</p>
                  <h2 className="text-lg font-semibold text-gradient">Dependency & Security Advisor</h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* New Chat button */}
                <button
                  onClick={() => { startNewChat(); setShowHistory(false); }}
                  className="btn btn-circle btn-sm btn-ghost"
                  aria-label="New Chat"
                  title="เริ่มแชทใหม่"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  onClick={handleClearHistory}
                  className="btn btn-circle btn-sm"
                  disabled={messages.length === 0}
                  aria-label="Clear"
                  title="ล้างข้อความ"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={handleClose}
                  className="btn btn-circle btn-sm"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Main content with optional sidebar */}
            <div className="flex flex-1 overflow-hidden">
              {/* History Sidebar */}
              {showHistory && (
                <div className="w-64 border-r border-base-content/10 bg-base-200/50 flex flex-col">
                  <div className="p-3 border-b border-base-content/10">
                    <h3 className="text-sm font-semibold text-base-content/80 flex items-center gap-2">
                      <History className="h-4 w-4" />
                      ประวัติการสนทนา ({sessions.length})
                    </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {sessions.length === 0 ? (
                      <div className="p-4 text-center text-sm text-base-content/50">
                        ยังไม่มีประวัติการสนทนา
                      </div>
                    ) : (
                      <div className="space-y-1 p-2">
                        {sessions.map((session) => (
                          <div
                            key={session.id}
                            className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-base-300/50 transition-colors ${session.id === currentSessionId ? 'bg-primary/10 border border-primary/20' : ''
                              }`}
                            onClick={() => { loadSession(session.id); setShowHistory(false); }}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-base-content/80 truncate">
                                {session.title || "New Chat"}
                              </p>
                              <p className="text-xs text-base-content/50">
                                {new Date(session.updatedAt).toLocaleDateString('th-TH', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                              className="btn btn-circle btn-xs btn-ghost opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label="Delete session"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Messages area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-theme-secondary/50">
                  {messages.length === 0 && !error && (
                    <div className="hero h-full">
                      <div className="hero-content text-center">
                        <div className="max-w-md space-y-4">
                          <div className="avatar placeholder">
                            <div className="bg-base-content/10 text-primary rounded-2xl w-16 flex items-center justify-center">
                              <MessageCircle className="h-8 w-8 animate-pulse" />
                            </div>
                          </div>
                          <div>
                            <h1 className="text-2xl font-bold text-base-content">
                              {chatbotReady ? "สวัสดี! 👋" : "กำลังเตรียมตัว..."}
                            </h1>
                            <p className="py-2 text-[#778873]">
                              {chatbotReady
                                ? "ถามเกี่ยวกับ dependencies และ vulnerabilities ได้เลย"
                                : "Initializing chatbot..."}
                            </p>
                          </div>
                          {chatbotReady && (
                            <div className="flex gap-2 justify-center">
                              <span className="badge text-primary border-base-content/10">CVE</span>
                              <span className="badge text-secondary border-base-content/10">Dependencies</span>
                              <span className="badge text-accent border-base-content/10">Security</span>
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
                        <div className={`group relative max-w-3xl w-full rounded-2xl border ${isUser
                          ? "bg-base-content/10 text-base-content/60 border-base-content/10"
                          : "bg-white/80 border-base-content/10"
                          } p-4 shadow-sm transition hover:shadow-md`}
                        >
                          {/* Render batched content with sections */}
                          <BatchedMessageContent content={message.content} />
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
                    <ProcessingStepsIndicator
                      currentStep={processingStep}
                      message={processingMessage}
                    />
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="border-t border-base-content/10 p-4 bg-base/50">
                  <div className="flex flex-col gap-3">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="ถามเกี่ยวกับ dependencies, vulnerabilities หรือ security guidance..."
                      disabled={!chatbotReady || loading}
                      className="textarea input-nature min-h-20 w-full resize-none text-base-content"
                    />
                    <div className="flex items-center justify-between text-xs text-base-content/60">
                      <span>{chatbotReady ? "พร้อมตอบทุกคำถาม" : "กำลังเตรียมตัว..."}</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost text-base-content/60 hover:bg-base-content/20"
                          onClick={() => setInput("")}
                          disabled={!input}
                        >
                          ล้างข้อความ
                        </button>
                        <button
                          type="submit"
                          disabled={!chatbotReady || loading || !input.trim()}
                          className="btn btn-nature"
                        >
                          <Send className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>{/* End messages area */}
            </div>{/* End main content with sidebar */}
          </div>
        </dialog>
      )}
    </>
  );
}
