"use client";

import React, { useState } from "react";
import { RAGEvaluationResult } from "@/lib/chatbot";
import { ChevronDown, ChevronUp, AlertTriangle, Sparkles } from "lucide-react";

interface EvaluationBadgeProps {
    evaluation: RAGEvaluationResult;
    className?: string;
}

function getScoreColor(score: number): string {
    if (score >= 0.8) return "text-success";
    if (score >= 0.6) return "text-warning";
    return "text-error";
}

function getScoreLabel(score: number): string {
    if (score >= 0.8) return "Good";
    if (score >= 0.6) return "Fair";
    return "Poor";
}

export const EvaluationBadge: React.FC<EvaluationBadgeProps> = ({
    evaluation,
    className = "",
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const overallScore = Math.round(evaluation.overall_score * 100);
    const scoreColor = getScoreColor(evaluation.overall_score);

    return (
        <div className={`text-xs ${className}`}>
            {/* Compact Badge */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full 
          bg-base-200 hover:bg-base-300 transition-colors cursor-pointer`}
                title="RAG Evaluation Score"
            >
                {evaluation.is_fallback ? (
                    <AlertTriangle className="w-3 h-3 text-warning" />
                ) : (
                    <Sparkles className="w-3 h-3 text-primary" />
                )}
                <span className={`font-semibold ${scoreColor}`}>
                    {overallScore}%
                </span>
                <span className="text-base-content/60">
                    {getScoreLabel(evaluation.overall_score)}
                </span>
                {isExpanded ? (
                    <ChevronUp className="w-3 h-3" />
                ) : (
                    <ChevronDown className="w-3 h-3" />
                )}
            </button>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="mt-2 p-3 bg-base-200 rounded-lg border border-base-300">
                    {/* Evaluation Type Badge */}
                    <div className="flex justify-center mb-2">
                        {evaluation.is_fallback ? (
                            <span className="badge badge-warning badge-sm gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Heuristic Eval
                            </span>
                        ) : (
                            <span className="badge badge-primary badge-sm gap-1">
                                <Sparkles className="w-3 h-3" />
                                Instructor LLM
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-center">
                        <div>
                            <div className="text-base-content/60 mb-1">Faithfulness</div>
                            <div className={`font-bold ${getScoreColor(evaluation.faithfulness)}`}>
                                {Math.round(evaluation.faithfulness * 100)}%
                            </div>
                            {evaluation.faithfulness_reason && (
                                <div className="text-xs text-base-content/40 mt-1 truncate" title={evaluation.faithfulness_reason}>
                                    {evaluation.faithfulness_reason.slice(0, 30)}...
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="text-base-content/60 mb-1">Relevancy</div>
                            <div className={`font-bold ${getScoreColor(evaluation.answer_relevancy)}`}>
                                {Math.round(evaluation.answer_relevancy * 100)}%
                            </div>
                            {evaluation.relevancy_reason && (
                                <div className="text-xs text-base-content/40 mt-1 truncate" title={evaluation.relevancy_reason}>
                                    {evaluation.relevancy_reason.slice(0, 30)}...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EvaluationBadge;

