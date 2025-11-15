"use client";

import { ReactNode } from "react";
import { ChatbotWidget } from "@/components/ChatbotWidget";
import { AuthService } from "@/lib/auth";
import { useEffect, useState } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await AuthService.getCurrentUser();
        setUserId(user?.id || null);
      } catch (error) {
        console.error("Failed to get user:", error);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, []);

  return (
    <div>
      {children}
      {!loading && userId && <ChatbotWidget userId={userId} />}
    </div>
  );
}
