import React, { useState, useRef, useEffect } from "react";
import { Send, X, Bot } from "lucide-react";
import { api } from "../api";
import type { Usuario } from "../api";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: Date;
}

interface ChatboxProps {
  usuario: Usuario;
}

export const Chatbox: React.FC<ChatboxProps> = ({ usuario }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: `¡Hola ${usuario.nombre}! Soy PatosAI 🦆. ¿En qué puedo ayudarte hoy?`,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Math.random().toString(),
      sender: "user",
      text: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    // Simulate thinking delay
    setTimeout(async () => {
      try {
        const responseText = await generateAIResponse(text);
        const aiMessage: Message = {
          id: Math.random().toString(),
          sender: "assistant",
          text: responseText,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } catch (error) {
        const errorMessage: Message = {
          id: Math.random().toString(),
          sender: "assistant",
          text: "Lo siento, tuve un pequeño problema de conexión al procesar tu solicitud. 🦆",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }
    }, 800);
  };

  const generateAIResponse = async (userText: string): Promise<string> => {
    const query = userText.toLowerCase().trim();
    
    if (query.includes("chiste") || query.includes("gracioso") || query.includes("pato")) {
      const jokes = [
        "¿Qué hace un pato con dolor de cabeza? ¡Pato-cetamol! 🦆",
        "¿Cuál es el plato favorito de un pato? ¡Los tallarines con pato! (Un poco turbio, mejor no se lo digas a nadie) 🍽️",
        "¿Por qué los patos no tienen dinero? ¡Porque todo lo pagan con el pico! 🪙",
        "¿Qué le dice un pato a otro? ¡Estamos empataos! 🤝",
        "¿Cómo maldice un pato? ¡Cuac-sea tu voluntad! 🧙‍♂️"
      ];
      return jokes[Math.floor(Math.random() * jokes.length)];
    }
    
    if (query.includes("mesa") || query.includes("ocupada") || query.includes("capacidad") || query.includes("disponib")) {
      try {
        const mesas = await api.mesas.getAll();
        const ocupadas = mesas.filter(m => m.estadoActual.toLowerCase() === "ocupado" || m.estadoActual.toLowerCase() === "ocupada").length;
        return `Actualmente hay ${mesas.length} mesas registradas en el sistema. ${ocupadas} están ocupadas y ${mesas.length - ocupadas} están disponibles. 🪑`;
      } catch (e) {
        return "No pude consultar el estado de las mesas en este momento. Inténtalo de nuevo. 🪑";
      }
    }

    if (query.includes("plato") || query.includes("producto") || query.includes("mas vendido") || query.includes("más vendido") || query.includes("bebida") || query.includes("carta")) {
      try {
        const productos = await api.productos.getAll();
        return `El catálogo cuenta con ${productos.length} productos registrados. Los platos favoritos de los clientes son el Cabrito guisado y la Pava al horno. 🍲`;
      } catch (e) {
        return "No pude obtener información del catálogo en este momento. 🍲";
      }
    }

    if (query.includes("cliente") || query.includes("registrar")) {
      return "Para registrar un cliente, dirígete a la pestaña 'Gestión Clientes' en el menú de la izquierda, haz clic en 'Nuevo Cliente', ingresa sus datos y guarda. ¡Es muy fácil! 👥";
    }

    if (query.includes("cocina") || query.includes("pedido") || query.includes("pendiente")) {
      try {
        const historial = await api.ventas.getHistorial();
        const pendientes = historial.filter(h => h.estado_cocina.toLowerCase() === "pendiente").length;
        const preparando = historial.filter(h => h.estado_cocina.toLowerCase() === "preparando" || h.estado_cocina.toLowerCase() === "en_preparacion").length;
        
        return `En este momento tenemos ${pendientes} pedidos pendientes en cocina y ${preparando} en preparación. ¡El equipo está trabajando a toda marcha! 🍳`;
      } catch (e) {
        return "No pude consultar el estado de la cocina en este momento. 🍳";
      }
    }

    if (query.includes("hola") || query.includes("buenas") || query.includes("saludo") || query.includes("hey")) {
      return `¡Hola, ${usuario.nombre}! Soy PatosAI 🦆, tu asistente virtual del Restaurant Los Patos. ¿En qué te puedo ayudar hoy? Prueba preguntándome sobre las mesas, el estado de la cocina o pídeme un chiste.`;
    }

    return "Entiendo tu consulta. Soy PatosAI, tu asistente virtual. Puedo darte reportes en tiempo real sobre las mesas ocupadas, platos del catálogo, pedidos en cocina o contarte algún chiste. ¿De qué te gustaría hablar? 🦆";
  };

  const QuickQuestionButton: React.FC<{ text: string }> = ({ text }) => (
    <button
      className="quick-question-btn"
      onClick={() => handleSend(text)}
    >
      {text}
    </button>
  );

  return (
    <div className="chatbox-wrapper">
      {/* Floating Button */}
      {!isOpen && (
        <button
          className="chatbox-toggle-btn"
          onClick={() => setIsOpen(true)}
          title="Abrir PatosAI"
        >
          <Bot size={28} className="bot-icon-animate" />
          <span className="pulse-dot"></span>
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="chatbox-card">
          {/* Header */}
          <div className="chatbox-header">
            <div className="header-info">
              <div className="bot-avatar">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <h4>PatosAI 🦆</h4>
                <div className="status-container">
                  <span className="status-dot"></span>
                  <span>Asistente en línea</span>
                </div>
              </div>
            </div>
            <button
              className="chatbox-close-btn"
              onClick={() => setIsOpen(false)}
              title="Cerrar chat"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages body */}
          <div className="chatbox-body">
            <div className="messages-list">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message-bubble-wrapper ${
                    msg.sender === "user" ? "user-message" : "assistant-message"
                  }`}
                >
                  <div className="message-bubble">
                    <p>{msg.text}</p>
                    <span className="message-time">
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="message-bubble-wrapper assistant-message">
                  <div className="message-bubble typing-bubble">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {messages.length === 1 && (
              <div className="quick-questions-container">
                <p className="suggestions-title">Preguntas sugeridas:</p>
                <div className="suggestions-grid">
                  <QuickQuestionButton text="¿Mesas ocupadas hoy? 🪑" />
                  <QuickQuestionButton text="¿Cómo está la cocina? 🍳" />
                  <QuickQuestionButton text="¿Platos más vendidos? 🍲" />
                  <QuickQuestionButton text="Chiste de patos 🦆" />
                </div>
              </div>
            )}
          </div>

          {/* Footer Input */}
          <form
            className="chatbox-footer"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputText);
            }}
          >
            <input
              type="text"
              placeholder="Escribe tu mensaje aquí..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="chatbox-input"
            />
            <button
              type="submit"
              className="chatbox-send-btn"
              disabled={!inputText.trim()}
              title="Enviar"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {/* Styled JSX */}
      <style>{`
        .chatbox-wrapper {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          font-family: inherit;
        }

        .chatbox-toggle-btn {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-primary, #3b82f6) 0%, #1d4ed8 100%);
          border: none;
          color: white;
          box-shadow: 0 4px 20px rgba(29, 78, 216, 0.4);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .chatbox-toggle-btn:hover {
          transform: scale(1.1) rotate(5deg);
          box-shadow: 0 6px 24px rgba(29, 78, 216, 0.5);
        }

        .bot-icon-animate {
          animation: wiggle 3s infinite ease-in-out;
        }

        @keyframes wiggle {
          0%, 100% { transform: rotate(0); }
          50% { transform: rotate(8deg); }
        }

        .pulse-dot {
          position: absolute;
          top: 2px;
          right: 2px;
          width: 14px;
          height: 14px;
          background: #10b981;
          border: 2px solid white;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        .chatbox-card {
          width: 380px;
          height: 520px;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
          border: 1px solid var(--card-border, #e2e8f0);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .chatbox-header {
          padding: 16px 20px;
          background: linear-gradient(135deg, var(--accent-primary, #3b82f6) 0%, #1e40af 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .header-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .bot-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chatbox-header h4 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: white;
        }

        .status-container {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.8);
        }

        .status-dot {
          width: 6px;
          height: 6px;
          background: #10b981;
          border-radius: 50%;
        }

        .chatbox-close-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.8);
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
        }

        .chatbox-close-btn:hover {
          color: white;
          background: rgba(255, 255, 255, 0.1);
        }

        .chatbox-body {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          background: #f8fafc;
          gap: 16px;
        }

        .messages-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }

        .message-bubble-wrapper {
          display: flex;
          width: 100%;
        }

        .user-message {
          justify-content: flex-end;
        }

        .assistant-message {
          justify-content: flex-start;
        }

        .message-bubble {
          max-width: 80%;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 0.88rem;
          line-height: 1.4;
          display: flex;
          flex-direction: column;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .user-message .message-bubble {
          background: var(--accent-primary, #3b82f6);
          color: white;
          border-bottom-right-radius: 2px;
        }

        .assistant-message .message-bubble {
          background: white;
          color: #334155;
          border-bottom-left-radius: 2px;
          border: 1px solid #e2e8f0;
        }

        .message-bubble p {
          margin: 0 0 4px 0;
          white-space: pre-line;
        }

        .message-time {
          font-size: 0.7rem;
          align-self: flex-end;
        }

        .user-message .message-time {
          color: rgba(255, 255, 255, 0.7);
        }

        .assistant-message .message-time {
          color: #94a3b8;
        }

        /* Typing indicator */
        .typing-bubble {
          display: flex;
          gap: 4px;
          padding: 12px 16px;
        }

        .typing-bubble .dot {
          width: 6px;
          height: 6px;
          background: #94a3b8;
          border-radius: 50%;
          animation: typingDelay 1.4s infinite ease-in-out both;
        }

        .typing-bubble .dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-bubble .dot:nth-child(2) { animation-delay: -0.16s; }

        @keyframes typingDelay {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        /* Quick questions */
        .quick-questions-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: auto;
          border-top: 1px dashed #e2e8f0;
          padding-top: 12px;
        }

        .suggestions-title {
          font-size: 0.78rem;
          color: #64748b;
          margin: 0;
          font-weight: 500;
        }

        .suggestions-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }

        .quick-question-btn {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 0.75rem;
          color: #334155;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .quick-question-btn:hover {
          background: #eff6ff;
          border-color: #bfdbfe;
          color: var(--accent-primary, #3b82f6);
        }

        /* Footer */
        .chatbox-footer {
          padding: 12px 16px;
          background: white;
          border-top: 1px solid #e2e8f0;
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .chatbox-input {
          flex: 1;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 0.88rem;
          outline: none;
          transition: border 0.2s;
          background: #ffffff;
          color: #334155;
        }

        .chatbox-input:focus {
          border-color: var(--accent-primary, #3b82f6);
        }

        .chatbox-send-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: var(--accent-primary, #3b82f6);
          border: none;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s;
        }

        .chatbox-send-btn:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .chatbox-send-btn:disabled {
          background: #e2e8f0;
          color: #94a3b8;
          cursor: not-allowed;
        }

        @media (max-width: 480px) {
          .chatbox-card {
            width: calc(100vw - 32px);
            height: calc(100vh - 100px);
            bottom: 16px;
            right: 16px;
          }
        }
      `}</style>
    </div>
  );
};
