'use client';

import { useEffect, useState, use } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase'; 
import Map from '@/components/Map';

interface TelemetryData {
  location: { lat: number; lng: number };
  speed: number;
  isSosActive: boolean;
}

export default function TrackerPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'telemetry', userId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setTelemetry(docSnap.data() as TelemetryData);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userId]);

  if (loading) return <div className="p-8 text-center text-cyan-400">Conectando a la red...</div>;
  if (!telemetry) return <div className="p-8 text-center text-red-500">Señal perdida.</div>;

  const datosParaElMapa = [
    {
      id: userId,
      latitude: telemetry.location.lat,
      longitude: telemetry.location.lng,
      pilot: "Familiar Monitoreado" 
    }
  ];

  // Cambio principal: Fondo negro/azulado oscuro 
  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-slate-950 p-4 font-sans text-white">
      
      {/* Alerta SOS con estilo brillo rojo */}
      {telemetry.isSosActive && (
        <div className="w-full bg-red-950/40 border border-red-500 text-red-500 text-5xl font-extrabold text-center py-8 mb-6 animate-pulse rounded-xl shadow-[0_0_40px_rgba(239,68,68,0.7)] tracking-widest uppercase">
          🚨 ALERTA SOS 🚨
        </div>
      )}

      
      <header className="w-full max-w-4xl bg-white/10 backdrop-blur-md rounded-xl shadow-lg p-6 mb-6 flex justify-between items-center border border-white/10 relative overflow-hidden">
        {/* Un pequeño brillo de fondo para hacerlo más "tech" */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-white tracking-wide">Monitor de Seguridad</h1>
          <p className="text-sm text-cyan-200/60">Enlace Satelital Activo</p>
        </div>
        <div className="text-right relative z-10">
          <p className="text-5xl font-mono text-cyan-400 font-bold drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
            {telemetry.speed} <span className="text-lg text-cyan-100/50">km/h</span>
          </p>
        </div>
      </header>

      {/* Contenedor del Mapa con borde neón ligero */}
      <div className="w-full max-w-4xl h-[500px] bg-slate-900 rounded-xl overflow-hidden relative border border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
         <Map telemetryData={datosParaElMapa} />
      </div>
    </div>
  );
}