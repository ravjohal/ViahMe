import { useEffect, useRef } from "react";
import { queryClient } from "@/lib/queryClient";

export function useMessageSocket(conversationId: string | null | undefined) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!conversationId) return;

    const connect = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws/messages?conversationId=${encodeURIComponent(conversationId)}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("Message socket connected for", conversationId);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "message:new" && data.conversationId === conversationId) {
            queryClient.invalidateQueries({ queryKey: ["/api/messages", conversationId] });
          }
        } catch (err) {
          console.error("Failed to parse message socket data:", err);
        }
      };

      ws.onclose = () => {
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = (error) => {
        console.error("Message socket error:", error);
        ws.close();
      };
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [conversationId]);
}
