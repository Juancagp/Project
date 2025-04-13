import { useState } from "react";
import { Message } from "../models/Message";
import { sendMessage } from "../services/WebSocketService";
import dayjs from "dayjs";

interface Props {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

function ChatSatelital({ messages, setMessages }: Props) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim() === "") return;
  
    // Comando destroy
    if (input.startsWith("/destroy ")) {
      const parts = input.split(" ");
      if (parts.length >= 2) {
        const satellite_id = parts[1];
        sendMessage({
          type: "DESTROY",
          satellite_id,
        });
      }
    }
  
    // Comando power
    else if (input.startsWith("/power ")) {
      const parts = input.split(" ");
      if (parts.length >= 3) {
        const satellite_id = parts[1];
        const power = parseInt(parts[2]);
        if (!isNaN(power)) {
          sendMessage({
            type: "CHANGE-POWER",
            satellite_id,
            power,
          });

          console.log("Enviado el cambio de power!!!")
        }
      }
    }
  
    // Mensaje normal
    else {
      sendMessage({
        type: "COMM",
        content: input,
      });
    }
  
    // Mensaje local (solo frontend)
    const localMessage: Message & { own?: boolean } = {
      station_id: "YO",
      name: "Tú",
      level: "info",
      date: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      content: input,
      own: true,
    };
  
    setMessages((prev) => [...prev, localMessage]);
    setInput("");
  };
  

  return (
    <div style={{ height: "80%", display: "flex", flexDirection: "column" }}>
      {/* Caja de Mensajes */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          marginBottom: "1rem",
          border: "1px solid lightgray",
          padding: "0.5rem",
          backgroundColor: "#f9f9f9",
        }}
      >
        {messages.length === 0 && <p>No hay mensajes aún...</p>}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              marginBottom: "0.5rem",
              textAlign: (msg as any).own ? "right" : "left",
              color: (msg as any).own ? "#2b9348" : "black",
              fontWeight: (msg as any).own ? "bold" : "normal",
            }}
          >
            {(msg as any).own ? (
                <>{msg.content}</>
              ) : (
                <>
                  <b>
                    [
                    <span
                      style={{
                        color: msg.level === "info" ? "blue" : msg.level === "warn" ? "red" : "white",
                      }}
                    >
                      {msg.level}
                    </span>
                    ][{msg.station_id}][{msg.date}]:
                  </b>{" "}
                  {msg.content}
                </>
              )}

          </div>
        ))}
      </div>

      {/* Input y botón */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          placeholder="Escribe un mensaje..."
          style={{ flex: 1, padding: "0.5rem" }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button onClick={handleSend}>Enviar</button>
      </div>
    </div>
  );
}

export default ChatSatelital;
