"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthService, User } from "@/lib/auth";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { PageHeader } from "@/components/PageHeader";
import Image from "next/image";
import { LogOut } from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (!AuthService.isAuthenticated()) {
        router.push("/");
        return;
      }

      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser) {
        router.push("/");
        return;
      }

      setUser(currentUser);
      setLoading(false);
    };

    loadUser();
  }, [router]);

  const handleLogout = async () => {
    await AuthService.logout();
    router.push("/");
  };

  if (loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  return (
    <div className="min-h-screen bg-base-200">
      <PageHeader user={user} showUser>
        <h1 className="text-xl font-bold">
          Dependency Nexus
        </h1>
        <button
          onClick={handleLogout}
          className="btn btn-outline btn-error gap-2 ml-auto "
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </PageHeader>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-3xl text-base-content flex items-center gap-3">
              Welcome, {user?.username}!
            </h2>
            <p className="opacity-70 text-base-content">
              You are successfully authenticated with GitHub.
            </p>
            {user?.email && (
              <p className="text-sm opacity-60 text-base-content">
                Email: {user.email}
              </p>
            )}
            <div className="card-actions mt-6">
              <button
                onClick={() => router.push("/repositories")}
                className="btn btn-outline btn-primary"
              >
                View Repositories & Analyze Dependencies
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
