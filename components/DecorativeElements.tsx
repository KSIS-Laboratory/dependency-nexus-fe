"use client";

import { useEffect, useState } from "react";

export default function DecorativeElements() {
    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            // Calculate scroll progress as percentage (0-1)
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = scrollHeight > 0 ? Math.min(window.scrollY / scrollHeight, 1) : 0;
            setScrollProgress(progress);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll(); // Initial call
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Bounded movement range (max 200px up/down from original position)
    const maxOffset = 200;
    const topElementOffset = scrollProgress * maxOffset;
    const bottomElementOffset = scrollProgress * -maxOffset;

    return (
        <>
            {/* Top-left decorative element - moves down as you scroll */}
            <div
                className="fixed top-20 left-20 w-32 h-32 bg-primary/30 rounded-full blur-3xl animate-pulse pointer-events-none z-0"
                style={{
                    transform: `translateY(${topElementOffset}px)`,
                }}
            />
            {/* Bottom-right decorative element - moves up as you scroll */}
            <div
                className="fixed bottom-20 right-20 w-32 h-32 bg-secondary/30 rounded-full blur-3xl animate-pulse pointer-events-none z-0"
                style={{
                    transform: `translateY(${bottomElementOffset}px)`,
                }}
            />
            {/* Middle decorative element - subtle horizontal movement */}
            <div
                className="fixed top-1/2 right-10 w-24 h-24 bg-accent/20 rounded-full blur-2xl pointer-events-none z-0"
                style={{
                    transform: `translate(${scrollProgress * -50}px, ${scrollProgress * 100 - 50}px)`,
                    opacity: 0.5 + scrollProgress * 0.3,
                }}
            />
        </>
    );
}
