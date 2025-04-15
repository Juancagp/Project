import { useEffect, useRef, useState } from "react";
import ChatSatelital from "../components/ChatSatelital";
import dayjs from "dayjs"; // Instala con npm i dayjs
import { connectWebSocket, sendMessage } from "../services/WebSocketService";
import { Satellite } from "../models/Satellite";
import { Launchsite } from "../models/Launchsite";
import { Message } from "../models/Message";
import SatellitesTable from "../components/SatellitesTable";
import SatellitesGlobe from "../components/SatellitesGlobe";
import { Coordinates } from "../models/types";

function Home() {
  const [crashSites, setCrashSites] = useState<{ lat: number, lng: number, satellite_id: string, message: string }[]>([]);
  const [launchArcs, setLaunchArcs] = useState<{satellite_id: string, start: Coordinates, end: Coordinates}[]>([]);
  const satellitesRef = useRef<Satellite[]>([]);
  const launchsitesRef = useRef<Launchsite[]>([]);
  const [satellites, setSatellites] = useState<Satellite[]>([]);
  const [launchsites, setLaunchsites] = useState<Launchsite[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);


  useEffect(() => {
    connectWebSocket((data: any) => {
      switch (data.type) {

        case "POWER-UP":
      satellitesRef.current = satellitesRef.current.map(sat => {
        if (sat.satellite_id === data.satellite_id) {
          return {
            ...sat,
            power: sat.power + data.amount,
          };
        }
        return sat;
      });
      break;

    case "POWER-DOWN":
      satellitesRef.current = satellitesRef.current.map(sat => {
        if (sat.satellite_id === data.satellite_id) {
          return {
            ...sat,
            power: Math.max(0, sat.power - data.amount), // Para que no quede negativo
          };
        }
        return sat;
      });
      break;



        case "POSITION_UPDATE":
          data.satellites.forEach((updatedSat: any) => {
            // Actualizar solo la posición de los satélites conocidos
            const sat = satellitesRef.current.find(
              (s) => s.satellite_id === updatedSat.satellite_id
            );


            if (sat) {
              sat.position = updatedSat.position
            }
          });
          break;

          case "CATASTROPHIC-FAILURE":
            const satToRemove = satellitesRef.current.find(
              (sat) => sat.satellite_id === data.satellite_id
            );

            if (satToRemove) {
              const newCrash = {
                satellite_id: data.satellite_id,
                lat: satToRemove.position.lat,
                lng: satToRemove.position.long,
                message: data.message,
              };

              // Agregar crash al estado
              setCrashSites((prev) => [...prev, newCrash]);

              // Programar eliminación automática a los 20s
              setTimeout(() => {
                setCrashSites((prev) =>
                  prev.filter((c) => c.satellite_id !== data.satellite_id)
                );
              }, 120000); 

              // Eliminar satélite de la data
              satellitesRef.current = satellitesRef.current.filter(
                (sat) => sat.satellite_id != data.satellite_id
              );
            }

            break;


          case "IN-ORBIT":
            satellitesRef.current.push({
              satellite_id: data.satellite_id,
              name: "",
              launchsite_origin: "",
              launch_date: "",
              position: { lat: 0, long: 0 },
              altitude: data.altitude,
              mission: "",
              organization: { name: "", country: { country_code: "", name: "" } },
              type: "COM",
              orbital_period: 0,
              lifespan: 0,
              power: 0,
              status: "in-orbit",
            });
          
            // Pedir status inmediato para que llegue info completa
            sendMessage({ type: "SATELLITE-STATUS", satellite_id: data.satellite_id });
            break;

            
            case "DEORBITING":
              satellitesRef.current = satellitesRef.current.filter(
                (sat) => sat.satellite_id !== data.satellite_id
              );
            
              setLaunchArcs(prev => prev.filter(
                arc => arc.satellite_id !== data.satellite_id
              ));
            
              break;
            


        case "SATELLITES":
          satellitesRef.current = satellitesRef.current.filter((sat) =>
            data.satellites.includes(sat.satellite_id)
          );
          data.satellites.forEach((id: string) => {
            const exists = satellitesRef.current.find((sat) => sat.satellite_id === id);
            if (!exists) {
              satellitesRef.current.push({
                satellite_id: id,
                name: "",
                launchsite_origin: "",
                launch_date: "",
                position: { lat: 0, long: 0 },
                altitude: 0,
                mission: "",
                organization: { name: "", country: { country_code: "", name: "" } },
                type: "COM",
                orbital_period: 0,
                lifespan: 0,
                power: 0,
                status: "in-orbit",
              });
            }
            sendMessage({ type: "SATELLITE-STATUS", satellite_id: id });
          });
          break;

        case "SATELLITE-STATUS":
          satellitesRef.current = [
            ...satellitesRef.current.filter(
              (sat) => sat.satellite_id !== data.satellite.satellite_id
            ),
            data.satellite,
          ];

          if (data.satellite.status !== "launching") {
            setLaunchArcs(prev => prev.filter(arc => arc.satellite_id !== data.satellite.satellite_id));
          }
        
          break;

        case "LAUNCHSITES":
          launchsitesRef.current = data.launchsites;
          break;

          case "COMM":
            setMessages((prev) => [
              ...prev,
              {
                station_id: data.satellite_id,
                name: data.satellite_id,  // Nombre por defecto
                level: data.easter_egg ? "info" : "warn", // Según enunciado
                date: dayjs().format("YYYY-MM-DD HH:mm:ss"), // Fecha actual formateada
                content: data.message, // Mensaje que llegó
              },
            ]);
            break

            case "LAUNCH":
              const launchsite = launchsitesRef.current.find(ls => ls.station_id === data.launchsite_id);
            
              if (launchsite) {
                setLaunchArcs(prev => [
                  ...prev,
                  {
                    satellite_id: data.satellite_id,
                    start: { lat: launchsite.location.lat, long: launchsite.location.long },
                    end: data.debris_site,
                  }
                ]);
              }
              break;
            
          
      }
    });

    setTimeout(() => {
      sendMessage({ type: "SATELLITES" });
      sendMessage({ type: "LAUNCHSITES" });
    }, 2000);

    const interval = setInterval(() => {
      setSatellites([...satellitesRef.current]);
      setLaunchsites([...launchsitesRef.current])

    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "0.5rem", fontFamily: "sans-serif" }}>
      <h1>🌐 Houston, we have a problem...?</h1>

      {/* Parte superior: Globo y Chat */}
      <div
        style={{
          display: "flex",
          flexWrap: "nowrap",
          gap:"50px"
        }}
      >
        {/* Globo */}
        <div style={{ flex: "1 1 50%", minWidth: "500px" }}>
          <SatellitesGlobe satellites={satellites} launchsites={launchsites} launchArcs ={launchArcs} crashSites={crashSites} />
        </div>

        {/* Chat */}
        <div
          style={{
            minWidth: "750px",
            height: "575px",
            padding: "1rem",
            border: "1px solid #ccc",
          }}
        >
          <h2>💬 Chat Satelital</h2>
          <ChatSatelital messages={messages} setMessages={setMessages} />
          </div>
      </div>

      {/* Tabla abajo */}
      <SatellitesTable satellites={satellites.filter(sat => sat.status === "in-orbit")} />

    </div>
  );
}

export default Home;
