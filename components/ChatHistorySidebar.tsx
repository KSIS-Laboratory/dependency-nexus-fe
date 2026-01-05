"use client";

import React from "react";
import { History, Trash2 } from "lucide-react";

export interface ChatSession {
    id: string;
    title: string;
    updatedAt: string;
}

interface ChatHistorySidebarProps {
    sessions: ChatSession[];
    currentSessionId: string | null;
    onLoadSession: (sessionId: string) => void;
    onDeleteSession: (sessionId: string) => void;
    onClose: () => void;
}

/**
 * Sidebar component for displaying chat history/sessions
 * Shows a list of past conversations with options to load or delete them
 */
export const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
    sessions,
    currentSessionId,
    onLoadSession,
    onDeleteSession,
    onClose,
}) => {
    const handleLoadSession = (sessionId: string) => {
        onLoadSession(sessionId);
        onClose();
    };

    const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        onDeleteSession(sessionId);
    };

    return (
        <div className="w-64 border-r border-base-content/10 bg-base-200/50 flex flex-col">
            {/* Header */}
            <div className="p-3 border-b border-base-content/10">
                <h3 className="text-sm font-semibold text-base-content/80 flex items-center gap-2">
                    <History className="h-4 w-4" />
                    ประวัติการสนทนา ({sessions.length})
                </h3>
            </div>

            {/* Session List */}
            <div className="flex-1 overflow-y-auto">
                {sessions.length === 0 ? (
                    <div className="p-4 text-center text-sm text-base-content/50">
                        ยังไม่มีประวัติการสนทนา
                    </div>
                ) : (
                    <ul className="space-y-1 p-2 list-none">
                        {sessions.map((session) => (
                            <li
                                key={session.id}
                                className={`group flex items-center gap-2 p-2 rounded-lg hover:bg-base-300/50 transition-colors ${session.id === currentSessionId
                                    ? 'bg-primary/10 border border-primary/20'
                                    : ''
                                    }`}
                            >
                                <button
                                    type="button"
                                    className="flex-1 min-w-0 text-left hover:cursor-pointer"
                                    onClick={() => handleLoadSession(session.id)}
                                >
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
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => handleDeleteSession(e, session.id)}
                                    className="btn btn-circle btn-xs btn-ghost opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                    aria-label="Delete session"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};
