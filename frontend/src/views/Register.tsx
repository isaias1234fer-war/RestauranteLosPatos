import React, { useState } from "react";
import { api } from "../api";

interface RegisterProps {
  onRegisterSuccess: () => void;
  onGoToLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onRegisterSuccess, onGoToLogin }) => {
  const [nombre, setNombre] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !username || !email || !password || !confirmPassword) {
      setError("Por favor complete todos los campos");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await api.auth.register(nombre, username, email, password);
      setSuccess("¡Registro exitoso! Redirigiendo al login...");
      setTimeout(() => {
        onRegisterSuccess();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Error al crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card glass-panel animate-fade-in">
        <div className="login-header">
          <div className="logo-badge">🦆</div>
          <h1>Registro de Usuario</h1>
          <p>Cree una nueva cuenta de empleado o administrador</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-banner">{error}</div>}
          {success && <div className="success-banner">{success}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="nombre">Nombre Completo</label>
            <input
              id="nombre"
              type="text"
              className="input-field"
              placeholder="Ej. Juan Pérez"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="username">Usuario (nickname)</label>
            <input
              id="username"
              type="text"
              className="input-field"
              placeholder="Ej. jperez"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Correo Electrónico</label>
            <input
              id="email"
              type="email"
              className="input-field"
              placeholder="Ej. juan@lospatos.pe"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirmar Contraseña</label>
            <input
              id="confirmPassword"
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? <div className="spinner"></div> : "Crear Cuenta"}
          </button>
        </form>

        <div className="login-footer">
          <span>¿Ya tienes cuenta?</span>
          <button type="button" className="btn-link" onClick={onGoToLogin}>
            Inicia sesión aquí
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
          padding: 20px;
          overflow-y: auto;
        }

        .login-card {
          width: 440px;
          padding: 40px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin: auto;
        }

        .login-header {
          text-align: center;
        }

        .login-header .logo-badge {
          font-size: 3rem;
          margin-bottom: 4px;
        }

        .login-header h1 {
          font-size: 2rem;
          font-weight: 800;
          margin: 0 0 4px;
          background: linear-gradient(135deg, #ffffff 30%, var(--accent-primary) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .login-header p {
          color: var(--text-muted);
          font-size: 0.9rem;
          margin: 0;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
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

        .success-banner {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.25);
          color: #34d399;
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
