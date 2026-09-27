"use client";


// Carga dinámica del mapa deshabilitando SSR

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
    collection,
    getDocs,
    addDoc,
    doc,
    getDoc,
    serverTimestamp,
    query,
    limit,
    onSnapshot,  
    where,            
    updateDoc,
    setDoc,
    arrayUnion,
    
} from "firebase/firestore";
import { signOut, User } from "firebase/auth";
import { Activity, AlertTriangle, Bike, HeartPulse, KeyRound, LogOut, Phone, Plus, Radio, Save, UserPlus, UserRound } from "lucide-react";


interface Squad {
    id: string;
    squadId: string;
    status: string;
    createdBy: string;
    members?: string[];
}
const Map = dynamic(() => import("./Map"), { ssr: false });


import motosBg from "@/assets/img/luaa.png";
export default function Dashboard({ user }: { user: User }) {
    const [telemetryList, setTelemetryList] = useState<any[]>([]);
    const [activeSquads, setActiveSquads] = useState<Squad[]>([]);
    const [joinCode, setJoinCode] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [profile, setProfile] = useState({
        displayName: "",
        emergencyPhone: "",
        bloodType: "",
        bikeModel: "",
    });
    const [profileSaving, setProfileSaving] = useState(false);

    useEffect(() => {
        if (!navigator.geolocation) {
            console.warn("La geolocalización no está soportada por este navegador.");
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const userIdentifier = user.email || user.uid;

                try {
                    await addDoc(collection(db, "telemetry"), {
                        pilot: userIdentifier,
                        latitude: latitude,
                        longitude: longitude,
                        updatedAt: serverTimestamp(),
                    });
                } catch (err) {
                    console.error("Error al enviar telemetría:", err);
                }
            },
            (err) => console.error("Error de GPS:", err.message),
            { enableHighAccuracy: true }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [user]);

useEffect(() => {
  const q = query(collection(db, "telemetry"), limit(20));
  const unsubTelemetry = onSnapshot(q, (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    setTelemetryList(list);
  });

  return () => unsubTelemetry();
}, []);

{/* Sección de Monitoreo en Mapa */}
<section className="space-y-3">
  <h2 className="text-sm font-mono uppercase tracking-wider text-[#00FFFF] flex items-center gap-2">
    📡 Monitoreo en Tiempo Real
  </h2>
  <Map telemetryData={telemetryList} />
</section>

    const handleStartRide = async (squadDocId: string) => {
        setActionLoading(true);
        try {
            await updateDoc(doc(db, "squads", squadDocId), {
                status: "active"
            });
            alert("¡La rodada ha iniciado! Estado cambiado a ACTIVE.");
        } catch (err: unknown) {
            const fireErr = err as { message?: string };
            setError("Error al iniciar la rodada: " + (fireErr.message || "Permiso denegado"));
        } finally {
            setActionLoading(false);
        }
    };

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const profileSnapshot = await getDoc(doc(db, "users", user.uid));
                if (profileSnapshot.exists()) {
                    const data = profileSnapshot.data();
                  //  setProfile({
                      //  displayName: data.displayName || "",
                      //  emergencyPhone: data.emergencyPhone || "",
                      //  bloodType: data.bloodType || "",
                       // bikeModel: data.bikeModel || "",
                 //   });
                }
            } catch (err) {
                console.error("Error al cargar perfil:", err);
            }
        };

        loadProfile();

        const squadsQuery = query(collection(db, "squads"), limit(10));
        const unsubSquads = onSnapshot(squadsQuery, (snapshot) => {
            const fetchedSquads: Squad[] = [];
            snapshot.forEach((docSnap) => {
                fetchedSquads.push({ id: docSnap.id, ...docSnap.data() as Omit<Squad, "id"> });
            });
            setActiveSquads(fetchedSquads);
        }, (err) => {
            console.error("Error en tiempo realll", err);
        });

        return () => {
            unsubSquads();
        };
    }, [user.uid]);

    const handleSaveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setProfileSaving(true);
        setError(null);

        try {
            await setDoc(doc(db, "users", user.uid), {
                ...profile,
                email: user.email || "",
                updatedAt: serverTimestamp(),
            }, { merge: true });
/// se le añadio el setProfile para limpiar los 
// ampos despues de guardar el perfil 
       setProfile({
        displayName: "",
        emergencyPhone:"",
        bloodType: "",
        bikeModel: "",
       });


            alert("¡Perfil actualizado correctamente!");
        } catch (err: unknown) {
            const fireErr = err as { message?: string };
            setError("Error al guardar el perfil: " + (fireErr.message || "Permiso denegado"));
        } finally {
            setProfileSaving(false);
        }
    };

    

    //moficicacion 75 a la 93 

    const handleCreateSquad = async () => {
        setActionLoading(true);
        try {
            const squadId = Math.random().toString(36).substring(2, 8).toUpperCase();
            await addDoc(collection(db, "squads"), {
                squadId: squadId,
                status: "waiting",
                createdAt: serverTimestamp(),
                createdBy: user.email || user.uid,
            });
            alert(`¡Nueva Rodada creada con éxito! Código: ${squadId}`);
        } catch (err: unknown) {
            console.error("Error al crear rodada:", err);
            const fireErr = err as { message?: string };
            setError("Error al crear la rodada: " + (fireErr.message || "Permiso denegado"));
        } finally {
            setActionLoading(false);
        }
    };

//  Agregagar miembros para rodada organizadaa *

const handleJoinSquad = async () => {
    if (!joinCode.trim()) {
        setError("Por favor ingresa un código de rodada válido.");
        return;
    }

    setActionLoading(true);
    setError(null);
    try {
        const cleanCode = joinCode.trim().toUpperCase();
        const q = query(collection(db, "squads"), where("squadId", "==", cleanCode));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            setError("No se encontró ninguna rodada con ese código.");
            setActionLoading(false);
            return;
        }

        const squadDoc = querySnapshot.docs[0];
        const userIdentifier = user.email || user.uid;

        await updateDoc(doc(db, "squads", squadDoc.id), {
            members: arrayUnion(userIdentifier)
        });

        alert(`¡Te has unido con éxito a la rodada [${cleanCode}]!`);
        setJoinCode("");
    } catch (err: unknown) {
        const fireErr = err as { message?: string };
        setError("Error al unirse a la rodada: " + (fireErr.message || "Permiso denegado"));
    } finally {
        setActionLoading(false);
    }
};


    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (err) {
            console.error("Error signing out:", err);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">
          <header 
    className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-cover bg-center bg-no-repeat relative border border-cyan-500/20 shadow-xl overflow-hidden"
    style={{ backgroundImage: `linear-gradient(rgba(22, 27, 38, 0.80), rgba(22, 27, 38, 0.80)), url(${motosBg.src || motosBg})` }}
><div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#8A2BE2] to-[#00FFFF] p-[2px] shadow-[0_0_15px_rgba(0,255,255,0.3)]">
                        <div className="w-full h-full bg-[#10141E] rounded-xl flex items-center justify-center">
                            <Radio className="w-5 h-5 text-[#00FFFF] animate-pulse" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white tracking-wider flex items-center gap-2">
                            CO-PILOTO <span className="text-[#00FFFF] text-xs font-mono px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">ONLINE</span>
                        </h1>
                        
                       {/* se le acomodo descripcion en linea 341 */} 
                        <p className="text-xs text-gray-400 font-mono cursor-pointer transition-all duration-300 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-[#B026FF] hover:via-[#39FF14] hover:to-[#FFE600]
                         hover:drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]">
                            Telemetría de escuadrones & Monitoreo en ruta</p>
                    </div>
                </div>

                {/* User Status & Logout */}
                <div className="flex items-center gap-3">
                    <div className="text-right font-mono text-xs hidden sm:block">
                       {/*mofificacion para que en el nombre de correo se vean colores al pasar el cursor */}
                        <p className="text-white font-semibold truncate max-w-[200px] cursor-pointer transition-all duration-300 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-[#00FFFF] hover:via-[#39FF14] hover:to-[#FF007F]
                         hover:drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]">
                            {user.isAnonymous ? "Piloto Anónimo" : user.email || user.displayName || "Piloto Autenticado"}
                        </p>
                        <p className="text-[#39FF14] text-[10px] flex items-center justify-end gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14] inline-block animate-ping" />
                            Sesión Activa: Token Verificado
                        </p>
                    </div>


                    <button
                        onClick={handleLogout}
                        title="Cerrar Sesión"
                        className="px-3 py-2 rounded-xl bg-[#0D111A] border border-gray-700 hover:border-red-500/60 hover:bg-red-950/30 text-gray-300 hover:text-red-400 text-xs font-semibold transition flex items-center gap-2"
                    >
                        <LogOut className="w-4 h-4 text-cyan-400 transition-colors group-hover:text-red-400" />
                        <span className="hidden md:inline">Cerrar Sesión</span>
                    </button>
                </div>
            </header>

            {/* Error Banner */}
            {error && (
                <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-sm flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                        <span>{error}</span>
                    </div>
                    <button
                        onClick={() => setError(null)}
                        className="text-xs underline hover:text-white"
                    >
                        Descartar
                    </button>
                </div>
            )}

            {/* Perfil del piloto */}
            <section className="p-6 rounded-2xl bg-[#161B26]/90 border border-gray-800 shadow-xl space-y-5">
                <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <UserRound className="w-5 h-5 text-[#00FFFF]" />
                        Perfil del Piloto
                    </h2>
                    <p className="text-xs text-gray-400 font-mono mt-1">
                        Captura la información personal relevante asociada a tu cuenta.
                    </p>
                </div>

                <form onSubmit={handleSaveProfile} className="border-t border-gray-800 pt-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="space-y-1.5">
                            <span className="text-xs text-gray-300 flex items-center gap-1.5">
                                <UserRound className="w-3.5 h-3.5 text-[#00FFFF]" /> Nombre o Apodo
                            </span>
                            <input
                                required
                                value={profile.displayName}
                                onChange={(event) => setProfile({ ...profile, displayName: event.target.value })}
                                placeholder="Ej. Moises"
                                className="w-full px-3 py-2.5 rounded-xl bg-[#0D111A] border border-gray-700 text-white text-sm focus:outline-none focus:border-[#00FFFF]"
                            />
                        </label>

                        <label className="space-y-1.5">
                            <span className="text-xs text-gray-300 flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-red-400" /> Teléfono de Emergencia
                            </span>
                            <input
                                required
                                type="tel"
                                value={profile.emergencyPhone}
                                onChange={(event) => setProfile({ ...profile, emergencyPhone: event.target.value })}
                                placeholder="Ej. 5568924193"
                                className="w-full px-3 py-2.5 rounded-xl bg-[#0D111A] border border-gray-700 text-white text-sm focus:outline-none focus:border-[#00FFFF]"
                            />
                        </label>

                        <label className="space-y-1.5">
                            <span className="text-xs text-gray-300 flex items-center gap-1.5">
                                <HeartPulse className="w-3.5 h-3.5 text-pink-500" /> Tipo de Sangre
                            </span>
                            <input
                                required
                                value={profile.bloodType}
                                onChange={(event) => setProfile({ ...profile, bloodType: event.target.value })}
                                placeholder="Ej. O+, A+, B-, AB+"
                                className="w-full px-3 py-2.5 rounded-xl bg-[#0D111A] border border-gray-700 text-white text-sm focus:outline-none focus:border-[#00FFFF]"
                            />
                        </label>

                        <label className="space-y-1.5">
                            <span className="text-xs text-gray-300 flex items-center gap-1.5">
                                <Bike className="w-3.5 h-3.5 text-purple-400" /> Modelo de Moto
                            </span>
                            <input
                                required
                                value={profile.bikeModel}
                                onChange={(event) => setProfile({ ...profile, bikeModel: event.target.value })}
                                placeholder="Ej. Italika 250Z"
                                className="w-full px-3 py-2.5 rounded-xl bg-[#0D111A] border border-gray-700 text-white text-sm focus:outline-none focus:border-[#00FFFF]"
                            />
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={profileSaving}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00FFFF] to-[#8A2BE2] text-[#0A0D14] font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(0,255,255,0.25)] hover:shadow-[0_0_22px_rgba(0,255,255,0.4)] transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {profileSaving ? (
                            <div className="w-4 h-4 border-2 border-[#0A0D14] border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        Guardar Información del Piloto
                    </button>
                </form>
            </section>



            {/* Panel de Gestión de Rodadas (Unirse o Crear) */}
            <div className="p-5 rounded-2xl bg-[#161B26] border border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleCreateSquad}
                        disabled={actionLoading}
                        className="w-full md:w-auto px-5 py-3 rounded-xl bg-[#FFEA00] hover:bg-[#FF6000] text-[#121212] font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(255,234,0,0.3)] transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Crear Nueva Rodada</span>
                    </button>
                </div>

                {/* Input para Unirse con Código */}
                <div className="flex items-center gap-2">
                    <div className="relative w-full">
                        <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            maxLength={6}
                            placeholder="CÓDIGO (Ej: X8K2P9)"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#0D111A] border border-gray-700 text-white font-mono text-xs placeholder-gray-500 focus:outline-none focus:border-[#00FFFF] uppercase"
                        />
                    </div>
                    <button
                        onClick={handleJoinSquad}
                        disabled={actionLoading || !joinCode}
                        className="px-4 py-2.5 rounded-xl bg-[#00FFFF] hover:bg-cyan-400 text-[#0A0D14] font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5 disabled:opacity-40 shrink-0"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>Unirme</span>
                    </button>
                </div>
            </div>

            {/* Rodadas Activas en Tiempo Real */}
            {activeSquads.length > 0 && (
                <div className="p-5 rounded-2xl bg-[#161B26] border border-cyan-500/30 space-y-3">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-[#00FFFF] flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Rodadas Activas en Vivo ({activeSquads.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {activeSquads.map((squad) => (
                            <div key={squad.id} className="p-3.5 rounded-xl bg-[#0D111A] border border-gray-800 font-mono text-xs space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-white font-bold">CÓDIGO: <span className="text-[#FFEA00]">{squad.squadId}</span></span>
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                                        {squad.status}
                                    </span>
                                </div>


                                
                                <p className="text-[11px] text-gray-400 truncate">Por: {squad.createdBy}</p>
                                <p className="text-[10px] text-cyan-300">
                                  Integrantes: {squad.members?.length || 1} piloto(s)
                                        </p>
                                {squad.status === "waiting" && (
                                    <button
                                        onClick={() => handleStartRide(squad.id)}
                                        disabled={actionLoading}
                                        className="w-full mt-2 py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[11px] uppercase tracking-wider transition disabled:opacity-50"
                                    >
                                        Iniciar Rodada
                                    </button>
                                )}
                            </div>
                        ))}

                    </div>
                </div>
            )}
{/* MAPA  Y MONITOREO de MOTOCICLISTAS */}
<section className="space-y-3 my-6">
  <div className="flex items-center gap-2.5 bg-[#0D111A] p-3 rounded-xl border border-[#FFEA00]/30 shadow-[0_0_12px_rgba(255,234,0,0.15)]">
    <span className="w-2.5 h-2.5 rounded-full bg-[#00FFFF] animate-ping" />
    <h2 className="text-sm font-mono uppercase tracking-wider text-[] font-bold">
      📡 MONITOREO EN TIEMPO REAL (MAPS)
    </h2>
  </div>

  {/* Componente del Mapa */}
  <Map telemetryData={telemetryList} />
</section>
        </div>
    );

}




