import { useEffect, useRef, useState } from "react";
import Globe from "globe.gl";
import { Satellite } from "../models/Satellite";
import { Launchsite } from "../models/Launchsite";

const createLaunchsiteMarker = (name: string) => {
    const marker = document.createElement('div');
    marker.style.width = '12px';
    marker.style.height = '12px';
    marker.style.borderRadius = '50%';
    marker.style.background = 'white';
    marker.style.border = '2px solid red';
    marker.title = name;  // Tooltip al pasar el mouse
    return marker;
  };
  

interface Props {
    satellites: Satellite[];
    launchsites: Launchsite[];
  }
  

const mapPowerToRadius = (power: number) => {
    const maxPower = 40;  // Potencia máxima esperada
    const maxRadius = 5;  // Radio máximo en el globo
    return (power / maxPower) * maxRadius;
  };
  

function SatellitesGlobe({ satellites, launchsites }: Props) {


    const typeColors: Record<string, string> = {
        COM: "orange",
        NAV: "lightblue",
        SPY: "red",
        SCI: "green",
        MIL: "purple",
        MET: "pink",
        OTHER: "gray"
      };

      
  const [showCoverage, setShowCoverage] = useState(true);
  const globeRef = useRef<HTMLDivElement>(null);
  const globeInstance = useRef<any>(null);
  const satData = useRef<any[]>([]);
  const [hoveredSat, setHoveredSat] = useState<any>(null);

  useEffect(() => {
    if (!globeRef.current) return;

    const globe = new Globe(globeRef.current)
      .globeImageUrl("//cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg")
      .width(750)
      .height(600)
      .backgroundColor("#000020")
      .pointOfView({ lat: 0, lng: 0, altitude: 2 })
      .pointLat((d: any) => d.lat)
      .pointLng((d: any) => d.lng)
      .pointAltitude((d: any) => d.altitude / 100000)
      .pointColor((d: any) =>
        hoveredSat?.id === d.id ? "yellow" : (typeColors[d.type] || "white")
      )      .pointLabel((d: any) => {
        const cercanos = satData.current.filter((sat) => {
          const dist = Math.sqrt(
            Math.pow(d.lat - sat.lat, 2) + Math.pow(d.lng - sat.lng, 2)
          );
          return dist <= sat.power;
        });

        const senalTotal = cercanos.reduce((acc, sat) => {
          const dist = Math.sqrt(
            Math.pow(d.lat - sat.lat, 2) + Math.pow(d.lng - sat.lng, 2)
          );
          const senal = Math.max(0, 1 - dist / sat.power);
          return acc + senal;
        }, 0);

        return `
          <b>${d.name}</b><br/>
          Misión: ${d.mission || "-"}<br/>
          Potencia: ${d.power || "-"}<br/>
          Altitud: ${d.altitude || "-"}<br/>
          Posición: (${d.lat.toFixed(2)}, ${d.lng.toFixed(2)})<br/>
          Satélites Cercanos: ${cercanos.length}<br/>
          Señal Recibida: ${senalTotal.toFixed(2)}
        `;
      })
      ;

    globeInstance.current = globe;

    const handleResize = () => {
      globe.width(500);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [hoveredSat]);

  useEffect(() => {
    satData.current = satellites.map((sat) => ({
      id: sat.satellite_id,
      lat: sat.position.lat,
      lng: sat.position.long,
      altitude: sat.altitude,
      name: sat.name || "(sin nombre)",
      mission: sat.mission || "-",
      power: sat.power || 0,
      type: sat.type || "OTHER",  // <--- NUEVO
    }));
  }, [satellites]);

  useEffect(() => {
    if (!globeInstance.current) return;

    const interval = setInterval(() => {
      globeInstance.current.pointsData(satData.current).pointsTransitionDuration(500);


      if (showCoverage) {
        globeInstance.current.ringsData(
          satData.current.map((sat) => ({
            lat: sat.lat,
            lng: sat.lng,
            maxR: mapPowerToRadius(sat.power),  // ← Mapeo lineal
            propagationSpeed: 0, // sin animación
            repeatPeriod: 2500, // ms
          }))
        ).ringRepeatPeriod(2000)
        .ringMaxRadius('maxR')
        .ringPropagationSpeed(3);
      } else {
        globeInstance.current.ringsData([]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [showCoverage]);

  return (
    <div style={{ position: "relative" }}>
      {/* Botón flotante */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "#f0f0f0",
          padding: "0.15rem 0.5rem",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          zIndex: 10,
          
        }}
      >
        <button onClick={() => setShowCoverage(!showCoverage)} style={{ border: "none", background: "none", cursor: "pointer", fontWeight: "bold" }}>
          {showCoverage ? "Ocultar Zonas" : "Mostrar Zonas"}
        </button>
      </div>
  
      {/* Globo */}
      <div ref={globeRef} />
      {/* Leyenda de colores por tipo */}
<div style={{ marginTop: "1rem", textAlign: "center" }}>
  <h3 style={{ marginBottom: "0.5rem" }}>Tipos de Satélites</h3>
  <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
    {Object.entries(typeColors).map(([tipo, color]) => (
      <div key={tipo} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
        <div style={{ width: "12px", height: "12px", backgroundColor: color, borderRadius: "50%" }} />
        <span>{tipo}</span>
      </div>
    ))}
  </div>
</div>

    </div>
  )
  
}

export default SatellitesGlobe;
