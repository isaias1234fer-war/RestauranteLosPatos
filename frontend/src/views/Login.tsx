import React, { useState } from "react";
import { api } from "../api";
import type { Usuario } from "../api";

interface LoginProps {
  onLoginSuccess: (usuario: Usuario) => void;
  onGoToRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onGoToRegister }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Por favor complete todos los campos");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const user = await api.auth.login(username, password);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || "Usuario o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card glass-panel animate-fade-in">
        <div className="login-header">
          <img src="/img/log.jpg" alt="Logo Los Patos" className="logo-badge" />
          <h1>Los Patos</h1>
          <p>Sistema de Gestión & Analítica</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-banner">{error}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="username">Usuario</label>
            <input
              id="username"
              type="text"
              className="input-field"
              placeholder="Ingrese su nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? <div className="spinner"></div> : "Iniciar Sesión"}
          </button>
        </form>

        <div className="login-footer">
          <span>¿No tienes cuenta?</span>
          <button type="button" className="btn-link" onClick={onGoToRegister}>
            Regístrate aquí
          </button>
        </div>
      </div>

      <style>{`
        .login-wrapper {
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #090d16;
        }

        .login-card {
          width: 420px;
          padding: 40px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .login-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .login-header .logo-badge {
          height: 80px;
          width: auto;
          object-fit: contain;
          margin-bottom: 16px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .login-header h1 {
          font-size: 2.25rem;
          font-weight: 800;
          margin: 0 0 4px;
          background: linear-gradient(135deg, #ffffff 30%, var(--accent-primary) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .login-header p {
          color: var(--text-muted);
          font-size: 0.95rem;
          margin: 0;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .error-banner {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #f87171;
          padding: 12px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 500;
          text-align: center;
        }

        .login-btn {
          margin-top: 8px;
          height: 48px;
        }

        .login-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 0.9rem;
          color: var(--text-muted);
        }

        .btn-link {
          background: transparent;
          border: none;
          color: var(--accent-primary);
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          padding: 0;
          text-decoration: underline;
        }
        .btn-link:hover {
          color: var(--accent-primary-hover);
        }
      `}</style>
    </div>
  );
};
