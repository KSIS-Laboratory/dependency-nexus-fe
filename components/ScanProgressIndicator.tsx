"use client";

import { useState } from "react";
import { Check, Loader2, Package, Shield, Database, Brain, CheckCircle2 } from "lucide-react";

export type ScanStep =
    | "idle"
    | "collecting"    // กำลังรวบรวม dependencies
    | "scanning"      // กำลังสแกน vulnerabilities
    | "indexing"      // กำลัง index ไป Neo4j
    | "vectorizing"   // กำลัง sync ไป Vector DB (Hybrid RAG)
    | "complete";     // เสร็จสิ้น

interface ScanProgressIndicatorProps {
    currentStep: ScanStep;
    message?: string;
}

const SCAN_STEPS: { step: ScanStep; label: string; icon: React.ReactNode }[] = [
    { step: "collecting", label: "รวบรวม Dependencies", icon: <Package className="h-4 w-4" /> },
    { step: "scanning", label: "สแกน Vulnerabilities", icon: <Shield className="h-4 w-4" /> },
    { step: "indexing", label: "Index to Graph", icon: <Database className="h-4 w-4" /> },
    { step: "vectorizing", label: "Hybrid RAG", icon: <Brain className="h-4 w-4" /> },
    { step: "complete", label: "เสร็จสิ้น", icon: <CheckCircle2 className="h-4 w-4" /> },
];

const STEP_MESSAGES: Record<ScanStep, string> = {
    idle: "",
    collecting: "กำลังรวบรวม dependencies จากโปรเจค...",
    scanning: "กำลังสแกนหาช่องโหว่ใน dependencies...",
    indexing: "กำลัง index ข้อมูลไปยัง Knowledge Graph...",
    vectorizing: "กำลัง sync ไปยัง Vector Database สำหรับ Hybrid RAG...",
    complete: "สแกนเสร็จสิ้น!",
};

export function ScanProgressIndicator({ currentStep, message }: Readonly<ScanProgressIndicatorProps>) {
    if (currentStep === "idle") {
        return null;
    }

    const currentIndex = SCAN_STEPS.findIndex((s) => s.step === currentStep);
    const displayMessage = message || STEP_MESSAGES[currentStep];

    return (
        <div className="alert shadow-lg bg-info/10 border-info/20">
            <div className="w-full">
                {/* Current step message */}
                <div className="flex items-center gap-3 mb-4">
                    {currentStep === "complete" ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                        <Loader2 className="h-5 w-5 animate-spin text-info" />
                    )}
                    <div>
                        <h3 className="font-bold text-base-content">
                            {currentStep === "complete" ? "Scan Complete!" : "Scanning in progress"}
                        </h3>
                        <p className="text-sm text-base-content/70">{displayMessage}</p>
                    </div>
                </div>

                {/* Step indicators */}
                <div className="flex items-center justify-between gap-2">
                    {SCAN_STEPS.map((stepInfo, index) => {
                        const isActive = stepInfo.step === currentStep;
                        const isCompleted = currentIndex > index || currentStep === "complete";
                        const isPending = currentIndex < index && currentStep !== "complete";

                        return (
                            <div key={stepInfo.step} className="flex-1">
                                <div className="flex flex-col items-center gap-1">
                                    {/* Step icon */}
                                    <div
                                        className={`
                      flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300
                      ${isActive ? "bg-primary text-primary-content scale-110 shadow-lg ring-2 ring-primary/30" : ""}
                      ${isCompleted ? "bg-success/20 text-success" : ""}
                      ${isPending ? "bg-base-300 text-base-content/40" : ""}
                    `}
                                    >
                                        {renderStepIcon(stepInfo, isActive, isCompleted)}
                                    </div>

                                    {/* Step label */}
                                    <span
                                        className={`text-xs text-center font-medium transition-colors ${getStepLabelClass(isActive, isCompleted)}`}
                                    >
                                        {stepInfo.label}
                                    </span>
                                </div>

                                {/* Progress line */}
                                {index < SCAN_STEPS.length - 1 && (
                                    <div className="absolute top-5 left-1/2 w-full h-0.5 -z-10">
                                        <div
                                            className={`h-full transition-all duration-500 ${isCompleted ? "bg-success" : "bg-base-300"
                                                }`}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                    <progress
                        className="progress progress-primary w-full"
                        value={currentStep === "complete" ? 100 : (currentIndex / (SCAN_STEPS.length - 1)) * 100}
                        max="100"
                    />
                </div>
            </div>
        </div>
    );
}

// Hook to manage scan progress state
export function useScanProgress() {
    const [step, setStep] = useState<ScanStep>("idle");
    const [message, setMessage] = useState<string>("");

    const updateProgress = (newStep: ScanStep, newMessage?: string) => {
        setStep(newStep);
        setMessage(newMessage || "");
    };

    const reset = () => {
        setStep("idle");
        setMessage("");
    };

    return {
        step,
        message,
        updateProgress,
        reset,
        isScanning: step !== "idle" && step !== "complete",
    };
}

// Helper functions to avoid nested ternary
function renderStepIcon(
    stepInfo: { icon: React.ReactNode },
    isActive: boolean,
    isCompleted: boolean
): React.ReactNode {
    if (isCompleted && !isActive) {
        return <Check className="h-5 w-5" />;
    }
    if (isActive) {
        return <span className="animate-pulse">{stepInfo.icon}</span>;
    }
    return stepInfo.icon;
}

function getStepLabelClass(isActive: boolean, isCompleted: boolean): string {
    if (isActive) return "text-primary";
    if (isCompleted) return "text-success";
    return "text-base-content/40";
}
