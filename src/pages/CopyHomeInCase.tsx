import { useEffect, useRef, useState } from "react";
import ChatSatelital from "../components/ChatSatelital";
import dayjs from "dayjs"; // Instala con npm i dayjs
import { connectWebSocket, sendMessage } from "../services/WebSocketService";
import { Satellite } from "../models/Satellite";
import { Launchsite } from "../models/Launchsite";
import { Message } from "../models/Message";
import SatellitesTable from "../components/SatellitesTable";
import SatellitesGlobe from "../components/SatellitesGlobe";

function Home() {
  const satellitesRef = useRef<Satellite[]>([]);
  const launchsitesRef = useRef<Launchsite[]>([]);
  const [satellites, setSatellites] = useState<Satellite[]>([]);
  const [launchsites, setLaunchsites] = useState<Launchsite[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    connectWebSocket((data: any) => {
      switch (data.type) {
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
          break;

        case "LAUNCHSITES":
          launchsitesRef.current = data.launchsites;
          break;

          case "COMM":
            setMessages((prev) => [
              ...prev,
              {
                station_id: data.satellite_id,
                name: "Mensaje Satelital",  // Nombre por defecto
                level: data.easter_egg ? "info" : "warn", // Según enunciado
                date: dayjs().format("YYYY-MM-DD HH:mm:ss"), // Fecha actual formateada
                content: data.message, // Mensaje que llegó
              },
            ]);
            break;
          
      }
    });

    setTimeout(() => {
      sendMessage({ type: "SATELLITES" });
      sendMessage({ type: "LAUNCHSITES" });
    }, 500);

    const interval = setInterval(() => {
      setSatellites([...satellitesRef.current]);
      setLaunchsites([...launchsitesRef.current]);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "0.5rem", fontFamily: "sans-serif" }}>
      <h1>🌐 Houston, we have a problem...</h1>

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
          <SatellitesGlobe satellites={satellites} />
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
          <ChatSatelital messages={messages} />
        </div>
      </div>

      {/* Tabla abajo */}
      <SatellitesTable satellites={satellites} />
    </div>
  );
}

export default Home;
