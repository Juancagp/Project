import { useEffect, useRef, useState } from "react";
import Globe from "globe.gl"; // Asegúrate que la importación y uso sea correcto para tu versión
import { Satellite } from "../models/Satellite";
import { Launchsite } from "../models/Launchsite";

interface Props {
    satellites: Satellite[];
    launchsites: Launchsite[];
}

const mapPowerToRadius = (power: number) => {
    const maxPower = 40;
    const maxRadius = 5;
    return (power / maxPower) * maxRadius;
};

function SatellitesGlobe({ satellites, launchsites }: Props) {

    const [selectedItem, setSelectedItem] = useState<any>(null);  // Puede ser satélite o launchsite

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
    const globeInstance = useRef<any>(null); // Considera usar un tipo más específico si globe.gl lo provee
    const satData = useRef<any[]>([]);
    const launchData = useRef<any[]>([]); // Mantenemos la ref para los datos procesados
    const [hoveredSat, setHoveredSat] = useState<any>(null);

    // --- 1. Efecto para Inicializar el Globo (solo una vez) ---
    useEffect(() => {
        if (!globeRef.current) return;

        // Usa el patrón correcto para instanciar (puede ser Globe()(...) o new Globe(...))
        const globe = new Globe(globeRef.current)
            .globeImageUrl("//cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg")
            // Ajusta width/height según sea necesario, o usa el tamaño del contenedor
            .width(750)
            .height(600)
            .backgroundColor("#000020")
            .pointOfView({ lat: 0, lng: 0, altitude: 2.5 }) // Ajusta altitud inicial

            // --- Configuración de Partículas (Launchsites) ---
            .particlesData([]) // Inicia vacío, se llenará después
            .particleLat((d: any) => d.lat)
            .particleLng((d: any) => d.lng) // CORREGIDO: usar d.lng
            .particleAltitude(0.01) // Un poco sobre el suelo
            .particlesColor(() => "white") // Color fijo para launchsites
            .particlesSize(6)        // Tamaño fijo (ajusta si lo deseas)
            .particleLabel((d: any) => d.name ? `<b>Launchsite:</b> ${d.name}`: 'Launchsite') // Etiqueta simple
            .onParticleClick((site: any) => {
                setSelectedItem({
                  type: 'launchsite',
                  data: site
                });
              })

            // --- Configuración de Puntos (Satélites) ---
            .pointsData([]) // Inicia vacío, se llenará después
            .pointLat((d: any) => d.lat)
            .pointLng((d: any) => d.lng)
            .pointAltitude((d: any) => d.altitude / 100000) // Ajusta la escala de altitud
            .pointRadius(0.35)
            .pointsTransitionDuration(0)
            .pointColor((d: any) =>
                hoveredSat?.id === d.id ? "yellow" : (typeColors[d.type] || "white")
            )
            .onPointClick((sat: any) => {
                setSelectedItem({
                  type: 'satellite',
                  data: sat
                });
              })
            // Mantenemos tu lógica de pointLabel, asegurándote que satData.current exista al momento del hover
            .pointLabel((d: any) => {
                // Considera simplificar o asegurar que los datos estén listos
                return `
                  <b>${d.name}</b><br/>
                  Misión: ${d.mission || "-"}<br/>
                  Potencia: ${d.power || "-"}<br/>
                  Altitud: ${d.altitude || "-"}<br/>
                  Posición: (${d.lat?.toFixed(2)}, ${d.lng?.toFixed(2)})<br/>
                  Tipo: ${d.type || 'N/A'}
                `;
                // La lógica de señal/cercanos puede ser pesada aquí, evalúa si es necesaria en el tooltip
            })
            .onPointHover(setHoveredSat); // Manejar hover si es necesario

        globeInstance.current = globe;

        // --- Manejo de Redimensionamiento ---
        const handleResize = () => {
            if (globeRef.current && globeInstance.current) {
                const { clientWidth, clientHeight } = globeRef.current;
                globeInstance.current.width(clientWidth);
                globeInstance.current.height(clientHeight);
            }
        };
        // Establecer tamaño inicial y escuchar cambios
        handleResize();
        window.addEventListener("resize", handleResize);

        // --- Limpieza ---
        return () => {
            window.removeEventListener("resize", handleResize);
            // Si globe.gl tiene un método dispose, llámalo aquí
            // globeInstance.current?.dispose?.();
            globeInstance.current = null;
        };

    }, []); // Dependencia vacía, se ejecuta solo al montar

    // --- 2. Efecto para Procesar Datos de Satélites ---
    useEffect(() => {
        // Mapea los datos cuando el prop 'satellites' cambie
        satData.current = satellites.map((sat) => ({
            id: sat.satellite_id,
            lat: sat.position.lat,
            lng: sat.position.long, // Asegúrate que la fuente de datos usa 'long' y mapea a 'lng'
            altitude: sat.altitude,
            name: sat.name || "(sin nombre)",
            mission: sat.mission || "-",
            power: sat.power || 0,
            type: sat.type || "OTHER",
        }));

        // Actualiza el globo si ya está instanciado
        if (globeInstance.current) {
            globeInstance.current.pointsData(satData.current);
        }
    }, [satellites]); // Se ejecuta cuando 'satellites' cambia

    // --- 3. Efecto para Procesar Datos de Launchsites ---
    useEffect(() => {
        // Mapea los datos cuando el prop 'launchsites' cambie
        launchData.current = launchsites.map((site) => ({
            id: site.station_id,
            lat: site.location.lat,
            lng: site.location.long, // Mapea 'long' a 'lng' consistentemente
            name: site.name || "(sin nombre)",
            countryName: site.country.name,
        }));

    }, [launchsites]); // Se ejecuta cuando 'launchsites' cambia

    // --- 4. Efecto para Actualizar Anillos de Cobertura ---
    useEffect(() => {
        if (!globeInstance.current) return;

        if (showCoverage) {
            globeInstance.current.ringsData(
                satData.current.map((sat) => ({
                    lat: sat.lat,
                    lng: sat.lng,
                    maxR: mapPowerToRadius(sat.power),
                    // propagationSpeed y repeatPeriod se configuran abajo
                }))
            )
            .ringColor(() => (t: number) => `rgba(100, 255, 100, ${Math.sqrt(1 - t)})`) // Color con desvanecimiento
            .ringMaxRadius('maxR')
            .ringPropagationSpeed(5) // Velocidad de propagación del anillo
            .ringRepeatPeriod(800);  // Frecuencia con la que se repite el anillo
        } else {
            globeInstance.current.ringsData([]); // Oculta los anillos
        }
        // Depende de showCoverage y satellites (porque los anillos usan satData)
    }, [showCoverage, satellites]);

    useEffect(() => {
        if (!globeInstance.current) return;
      
        globeInstance.current.particlesData([launchData.current]);
      }, [launchsites]);
      


    // --- Se eliminó el useEffect con setInterval ---
    // Las actualizaciones ahora se basan en cambios de props (satellites, launchsites)
    // y estado (showCoverage). Si necesitas simular movimiento, necesitarías
    // un mecanismo diferente para obtener y actualizar posiciones periódicamente.

    return (
        // Asegúrate que este div o su padre tengan dimensiones definidas
        <div style={{ position: "relative", width: "750px", height: "600px" }}>
            {/* Botón flotante */}
            <div
                style={{
                    position: "absolute",
                    top: "10px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    backgroundColor: "rgba(240, 240, 240, 0.8)", // Fondo semi-transparente
                    padding: "0.25rem 0.75rem",
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    zIndex: 10,
                }}
            >
                <button onClick={() => setShowCoverage(!showCoverage)} style={{ border: "none", background: "none", cursor: "pointer", fontWeight: "bold", fontSize: '0.9rem' }}>
                    {showCoverage ? "Ocultar Cobertura" : "Mostrar Cobertura"}
                </button>
            </div>

            {/* Globo */}
            <div ref={globeRef} style={{ width: '100%', height: '100%' }} />

            {/* Leyenda de colores */}
            <div style={{
                 position: 'absolute',
                 bottom: '10px',
                 left: '10px',
                 backgroundColor: 'rgba(0, 0, 32, 0.7)',
                 padding: '10px',
                 borderRadius: '5px',
                 color: 'white',
                 zIndex: 10
             }}>
                <h4 style={{ margin: "0 0 0.5rem 0", textAlign: 'center' }}>Tipos de Satélites</h4>
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.3rem 0.8rem", alignItems: 'center' }}>
                    {Object.entries(typeColors).map(([tipo, color]) => (
                        // Usar fragmento <>...</> para agrupar elementos sin añadir nodos extra al DOM
                        <>
                            <div key={`${tipo}-color`} style={{ width: "12px", height: "12px", backgroundColor: color, borderRadius: "50%" }} />
                            <span key={tipo}>{tipo}</span>
                        </>
                    ))}
                </div>
            </div>

            {selectedItem && (
            <div
                style={{
                position: 'absolute',
                top: '100px',  // Ajusta según tu layout
                right: '30px',
                backgroundColor: 'white',
                color: 'black',
                padding: '1rem',
                borderRadius: '8px',
                boxShadow: '0 0 10px rgba(0,0,0,0.3)',
                zIndex: 20,
                maxWidth: '300px'
                }}
            >
                <button
                onClick={() => setSelectedItem(null)}
                style={{ float: 'right', cursor: 'pointer' }}
                >
                ❌
                </button>

                {selectedItem.type === 'satellite' ? (
                <>
                    <h4>Satélite: {selectedItem.data.name}</h4>
                    <p>ID: {selectedItem.data.id}</p>
                    <p>Latitud: {selectedItem.data.lat}</p>
                    <p>Longitud: {selectedItem.data.lng}</p>
                    <p>Altitud: {selectedItem.data.altitude}</p>
                    <p>Misión: {selectedItem.data.mission}</p>
                    <p>Tipo: {selectedItem.data.type}</p>
                    <p>Potencia: {selectedItem.data.power}</p>
                </>
                ) : (
                <>
                    <h4>Launchsite: {selectedItem.data.name}</h4>
                    <p>ID: {selectedItem.data.id}</p>
                    <p>Lat: {selectedItem.data.lat}</p>
                    <p>Long: {selectedItem.data.lng}</p>
                    <p>País: {selectedItem.data.countryName}</p>
                </>
                )}
            </div>
            )}

        </div>
    );
}

export default SatellitesGlobe;