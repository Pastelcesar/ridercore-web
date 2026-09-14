"use client";

import { useState } from "react";
import { auth, googleProvider } from "@/lib/firebase";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup
} from "firebase/auth";
import { Shield, Lock, Mail, AlertCircle, ArrowRight } from "lucide-react";

export default function AuthCard() {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setLoading(true);

        try {
            if (isRegister) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (err: unknown) {
            console.error("Auth error:", err);
            const error = err as { code?: string; message?: string };
            switch (error.code) {
                case "auth/invalid-credential":
                case "auth/wrong-password":
                case "auth/user-not-found":
                    setErrorMsg("Credenciales incorrectas. Verifica tu correo y contraseña.");
                    break;
                case "auth/email-already-in-use":
                    setErrorMsg("Este correo ya está registrado. Prueba iniciando sesión.");
                    break;
                case "auth/weak-password":
                    setErrorMsg("La contraseña debe tener al menos 6 caracteres.");
                    break;
                case "auth/invalid-email":
                    setErrorMsg("El formato del correo electrónico no es válido.");
                    break;
                case "auth/operation-not-allowed":
                    setErrorMsg("Este método de acceso no está habilitado en la consola de Firebase.");
                    break;
                default:
                    setErrorMsg(error.message || "Ocurrió un error al autenticar.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setErrorMsg(null);
        setLoading(true);
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (err: unknown) {
            console.error("Google auth error:", err);
            const error = err as { code?: string; message?: string };
            if (error.code === "auth/popup-closed-by-user") {
                setErrorMsg("Se cerró la ventana de inicio de sesión con Google.");
            } else if (error.code === "auth/operation-not-allowed") {
                setErrorMsg("El proveedor Google no está habilitado en Firebase Authentication.");
            } else {
                setErrorMsg(error.message || "Error al conectar con Google.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md p-8 rounded-2xl bg-[#121212] border border-[#A1A1AA]/20 shadow-2xl transition-all duration-300">
            {/* Header / Logo */}
            <div className="flex flex-col items-center mb-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#FF6000] p-[2px] mb-3 shadow-[0_0_20px_rgba(255,96,0,0.3)]">
                    <div className="w-full h-full bg-[#000000] rounded-2xl flex items-center justify-center">
                        <Shield className="w-7 h-7 text-[#FFEA00]" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold tracking-wider text-white">
                    CO-PILOTO <span className="text-[#FFEA00]">ACCESS</span>
                </h2>
                <p className="text-xs text-[#A1A1AA] mt-1 uppercase tracking-widest">
                    Autenticación requerida por reglas de seguridad
                </p>
            </div>

            {/* Error Banner */}
            {errorMsg && (
                <div className="mb-4 p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* Tabs: Login / Register */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-[#000000] rounded-xl mb-6 border border-[#A1A1AA]/20">
                <button
                    type="button"
                    onClick={() => {
                        setIsRegister(false);
                        setErrorMsg(null);
                    }}
                    className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                        !isRegister
                            ? "bg-[#FFEA00] text-[#000000] shadow-[0_0_12px_rgba(255,234,0,0.2)]"
                            : "text-[#A1A1AA] hover:text-[#FFFFFF]"
                    }`}
                >
                    Iniciar Sesión
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setIsRegister(true);
                        setErrorMsg(null);
                    }}
                    className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                        isRegister
                            ? "bg-[#FFEA00] text-[#000000] shadow-[0_0_12px_rgba(255,234,0,0.2)]"
                            : "text-[#A1A1AA] hover:text-[#FFFFFF]"
                    }`}
                >
                    Registrarse
                </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-[#FFFFFF] mb-1.5 uppercase tracking-wider">
                        Correo Electrónico
                    </label>
                    <div className="relative">
                        <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="piloto@copiloto.space"
                            className="w-full bg-[#000000] border border-[#A1A1AA]/40 rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#FFFFFF] placeholder-[#A1A1AA] focus:outline-none focus:border-[#FFEA00] focus:ring-1 focus:ring-[#FFEA00] transition"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-[#FFFFFF] mb-1.5 uppercase tracking-wider">
                        Contraseña
                    </label>
                    <div className="relative">
                        <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-[#000000] border border-[#A1A1AA]/40 rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#FFFFFF] placeholder-[#A1A1AA] focus:outline-none focus:border-[#FF6000] focus:ring-1 focus:ring-[#FF6000] transition"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 px-4 rounded-xl bg-[#FF6000] hover:bg-[#FFEA00] text-[#000000] font-bold text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(255,96,0,0.25)] hover:shadow-[0_0_28px_rgba(255,96,0,0.45)] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-[#000000] border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>
                            <span>{isRegister ? "Crear Credencial" : "Conectar al Panel"}</span>
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#161B26] px-3 text-gray-500 font-mono tracking-widest">
                        Otras Vías
                    </span>
                </div>
            </div>

            {/* Alternate Login Buttons */}
            <div className="space-y-2.5">
                <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#000000] border border-[#A1A1AA]/40 hover:border-[#FFFFFF] text-[#FFFFFF] text-xs font-semibold transition flex items-center justify-center gap-3 disabled:opacity-50"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                            fill="#EA4335"
                            d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                        />
                        <path
                            fill="#4285F4"
                            d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.8 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 20.4 7.5 23 12 23z"
                        />
                    </svg>
                    <span>Continuar con Google</span>
                </button>

            </div>

        </div>
    );
}
