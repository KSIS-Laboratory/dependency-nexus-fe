"use client";

import { Heart, Shield, ExternalLink } from "lucide-react";

interface CopyrightFooterProps {
    /** Optional additional className */
    className?: string;
    /** Show minimal version (just copyright) */
    minimal?: boolean;
}

export default function CopyrightFooter({
    className = "",
    minimal = false,
}: Readonly<CopyrightFooterProps>) {
    const currentYear = new Date().getFullYear();

    if (minimal) {
        return (
            <footer
                className={`py-4 text-center text-sm text-base-content/60 ${className}`}
            >
                <p>© {currentYear} Dependency Nexus. All rights reserved.</p>
            </footer>
        );
    }

    return (
        <footer
            className={`border-t border-base-300 bg-base-200/50 backdrop-blur-sm ${className}`}
        >
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Left - Logo & Description */}
                    <div className="flex flex-col items-center md:items-start gap-2">
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            <span className="font-semibold text-base-content">
                                Dependency Nexus
                            </span>
                        </div>
                        <p className="text-sm text-base-content/60 text-center md:text-left max-w-xs">
                            Secure your dependencies. Analyze vulnerabilities. Protect your
                            projects.
                        </p>
                    </div>

                    {/* Center - Links */}
                    <div className="flex items-center gap-6 text-sm text-base-content/70">
                        <a
                            href="https://github.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 hover:text-primary transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" />
                            <span>GitHub</span>
                        </a>
                        <span className="hidden sm:inline text-base-content/30">•</span>
                        <a
                            href="#"
                            className="hover:text-primary transition-colors hidden sm:inline"
                        >
                            Documentation
                        </a>
                        <span className="hidden sm:inline text-base-content/30">•</span>
                        <a
                            href="#"
                            className="hover:text-primary transition-colors hidden sm:inline"
                        >
                            Privacy Policy
                        </a>
                    </div>

                    {/* Right - Copyright */}
                    <div className="flex flex-col items-center md:items-end gap-1">
                        <p className="text-sm text-base-content/60">
                            © {currentYear} Dependency Nexus
                        </p>
                        <p className="text-xs text-base-content/40 flex items-center gap-1">
                            Made with <Heart className="w-3 h-3 text-error animate-pulse" />{" "}
                            for secure development
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
