import React, { useState, useEffect } from "react";
import type { Usuario } from "./api";
import { Sidebar } from "./components/Sidebar";
import { Chatbox } from "./components/Chatbox";
import { Login } from "./views/Login";
import { Register } from "./views/Register";
import { Ventas } from "./views/Ventas";
import { Cocina } from "./views/Cocina";
import { Mesas } from "./views/Mesas";
import { Clientes } from "./views/Clientes";
import { Catalogo } from "./views/Catalogo";
import { Analitica } from "./views/Analitica";
import { Historial } from "./views/Historial";
import { Predicts } from "./views/Predicts";
import { Dashboard } from "./views/Dashboard";
import { ModelosIA } from "./views/ModelosIA";
import { Menu } from "lucide-react";

export const App: React.FC = () => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [vistaActual, setVistaActual] = useState<string>("dashboard");

  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth <= 900);

  // Load user from localStorage if it exists
  useEffect(() => {
    const savedUser = localStorage.getItem("usuario");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser) as Usuario;
        setUsuario(parsed);
      } catch (e) {
        localStorage.removeItem("usuario");
      }
    }
  }, []);

  const handleLoginSuccess = (user: Usuario) => {
    setUsuario(user);
    localStorage.setItem("usuario", JSON.stringify(user));
    setVistaActual("dashboard");
  };

  const handleLogout = () => {
    setUsuario(null);
    localStorage.removeItem("usuario");
    setAuthView("login");
  };

  // Route guarding
  const isAdmin = usuario?.rolSistema === "administrador";
  
  // If not admin, restrict admin views
  const effectiveView = (!isAdmin && ["catalogo", "analitica", "historial", "predicts", "modelos-ia"].includes(vistaActual)) 
    ? "ventas" 
    : vistaActual;

  const renderView = () => {
    if (!usuario) return null;

    switch (effectiveView) {
      case "dashboard":
        return <Dashboard usuario={usuario} setVistaActual={setVistaActual} />;
      case "ventas":
        return <Ventas usuario={usuario} />;
      case "cocina":
        return <Cocina />;
      case "mesas":
        return <Mesas />;
      case "clientes":
        return <Clientes />;
      case "catalogo":
        return <Catalogo />;
      case "analitica":
        return <Analitica />;
      case "historial":
        return <Historial />;
      case "predicts":
        return <Predicts setVistaActual={setVistaActual} />;
      case "modelos-ia":
        return <ModelosIA />;
      default:
        return <Ventas usuario={usuario} />;
    }
  };

  if (!usuario) {
    if (authView === "register") {
      return (
        <Register
          onRegisterSuccess={() => setAuthView("login")}
          onGoToLogin={() => setAuthView("login")}
        />
      );
    }
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onGoToRegister={() => setAuthView("register")}
      />
    );
  }

  return (
    <div className={`layout-container ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <header className="mobile-top-bar">
        <button 
          className="mobile-menu-toggle" 
          onClick={() => setSidebarCollapsed(false)}
          title="Abrir menú"
        >
          <Menu size={24} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src="/img/log.jpg" alt="Logo" style={{ height: "30px", width: "30px", objectFit: "contain", borderRadius: "6px" }} />
          <span className="mobile-logo-text">Los Patos</span>
        </div>
      </header>

      {!sidebarCollapsed && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setSidebarCollapsed(true)} 
        />
      )}

      <Sidebar
        usuario={usuario}
        vistaActual={effectiveView}
        setVistaActual={setVistaActual}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main className="main-content">
        {renderView()}
      </main>
      <Chatbox usuario={usuario} />
    </div>
  );
};

export default App;
