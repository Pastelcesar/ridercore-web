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
    // Usamos el userId 
    //para buscar la base de datos
    const docRef = doc(db, 'telemetry', userId);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setTelemetry(docSnap.data() as TelemetryData);
      } else {
        console.error("No se encontraron datos.");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  if (loading) return <div className="p-8 text-center">Cargando...</div>;
  if (!telemetry) return <div className="p-8 text-center text-red-500">Sin conexión de red.</div>;

  const datosParaElMapa = [
    {
      id: userId,
      latitude: telemetry.location.lat,
      longitude: telemetry.location.lng,
      pilot: "Familiar Monitoreado" 
    }
  ];

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-gray-50 p-4">
      
      {telemetry.isSosActive && (
        <div className="w-full bg-red-600 text-white text-5xl font-extrabold text-center py-8 mb-6 animate-pulse rounded-xl shadow-2xl">
          🚨 ALERTA SOS 🚨
        </div>
      )}

      <header className="w-full max-w-4xl bg-white rounded-xl shadow-md p-6 mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Monitor de Seguridad</h1>
        </div>
        <div className="text-right">
          <p className="text-4xl font-mono text-blue-600 font-bold">
            {telemetry.speed} <span className="text-lg text-gray-400">km/h</span>
          </p>
        </div>
      </header>

      <div className="w-full max-w-4xl h-[500px] bg-gray-200 rounded-xl overflow-hidden relative">
         <Map telemetryData={datosParaElMapa} />
      </div>
    </div>
  );
}