const WS_URL = "wss://tarea-2.2025-1.tallerdeintegracion.cl/connect";

let socket: WebSocket | null = null;
let reconnectInterval: any = null; // Para limpiar el interval

export const connectWebSocket = (
  onEvent: (data: any) => void,
  onError?: () => void
) => {
  if (socket) {
    console.log("WebSocket ya conectado");
    return;
  }

  const initWebSocket = () => {
    socket = new WebSocket(WS_URL);

    socket.onopen = () => {
      console.log("WebSocket conectado");

      clearInterval(reconnectInterval); // Deja de intentar reconectar
      reconnectInterval = null;

      socket!.send(
        JSON.stringify({
          type: "AUTH",
          name: "Juan Gil",
          student_number: "20643705",
        })
      );
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      //console.log("Evento recibido:", data);
      onEvent(data);
    };

    socket.onerror = () => {
      console.error("Error en WebSocket");
      if (onError) onError();
    };

    socket.onclose = () => {
      console.warn("WebSocket cerrado");

      socket = null;

      // Intentar reconectar cada 3 segundos
      if (!reconnectInterval) {
        reconnectInterval = setInterval(() => {
          console.log("Intentando reconectar WebSocket...");
          initWebSocket();
        }, 3000);
      }
    };
  };

  initWebSocket();
};

export const sendMessage = (payload: any) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
};
