"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import AuthCard from "@/components/AuthCard";
import Dashboard from "@/components/Dashboard";

export default function Home() {
    const [user, setUser] = useState<User | null>(null);
    const [authChecking, setAuthChecking] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setAuthChecking(false);
        });

        return () => unsubscribe();
    }, []);

    if (authChecking) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#0D111A] text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-3 border-[#00FFFF] border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(0,255,255,0.4)]" />
                    <p className="font-mono text-xs text-gray-400 tracking-widest uppercase animate-pulse">
                        Verificando credenciales de vuelo...
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-[#000000] text-[#FFFFFF] p-4 sm:p-8 lg:p-12 relative overflow-hidden">
            {/* Background glowing effects */}
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#FFEA00]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#FF6000]/5 rounded-full blur-3xl pointer-events-none" />

            <div className="z-10 w-full flex flex-col items-center">
                {user ? <Dashboard user={user} /> : <AuthCard />}
            </div>
        </main>
    );
}
