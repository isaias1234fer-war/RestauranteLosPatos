import React, { useState, useEffect } from "react";
import { api } from "../api";
import type { Mesa } from "../api";
import { Plus, Pencil, Trash2 } from "lucide-react";

export const Mesas: React.FC = () => {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form states
  const [numeroMesa, setNumeroMesa] = useState("");
  const [capacidad, setCapacidad] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [estadoActual, setEstadoActual] = useState("disponible");
  const [formOpen, setFormOpen] = useState(false);
  const [editingMesaId, setEditingMesaId] = useState<number | null>(null);

  const loadMesas = async () => {
    setLoading(true);
    try {
      const data = await api.mesas.getAll();
      setMesas(data);
    } catch (err: any) {
      setError("Error al cargar las mesas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMesas();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroMesa || !capacidad) {
      setError("Número de Mesa y Capacidad son obligatorios");
      return;
    }

    const mesaData = {
      numeroMesa: parseInt(numeroMesa),
      capacidad: parseInt(capacidad),
      ubicacion: ubicacion || "Salón Principal",
      estadoActual: estadoActual,
    };

    try {
      if (editingMesaId !== null) {
        await api.mesas.update(editingMesaId, mesaData);
      } else {
        await api.mesas.create(mesaData);
      }

      // Reset
      setNumeroMesa("");
      setCapacidad("");
      setUbicacion("");
      setEstadoActual("disponible");
      setEditingMesaId(null);
      setFormOpen(false);
      setError("");
      loadMesas();
    } catch (err: any) {
      setError(err.message || "Error al registrar la mesa");
    }
  };

  const handleStartEdit = (mesa: Mesa) => {
    setNumeroMesa(mesa.numeroMesa.toString());
    setCapacidad(mesa.capacidad.toString());
    setUbicacion(mesa.ubicacion || "");
    setEstadoActual(mesa.estadoActual || "disponible");
    setEditingMesaId(mesa.mesaId);
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setNumeroMesa("");
    setCapacidad("");
    setUbicacion("");
    setEstadoActual("disponible");
    setEditingMesaId(null);
    setFormOpen(false);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Está seguro de eliminar esta mesa?")) return;
    try {
      await api.mesas.delete(id);
      loadMesas();
    } catch (err: any) {
      alert(err.message || "No se pudo eliminar la mesa");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "disponible":
        return <span className="badge badge-success">Disponible</span>;
      case "ocupada":
        return <span className="badge badge-danger">Ocupada</span>;
      case "reservada":
        return <span className="badge badge-warning">Reservada</span>;
      default:
        return <span className="badge badge-primary">{status}</span>;
    }
  };

  return (
    <div className="animate-fade-in view-layout">
      <div className="view-header">
        <div>
          <h1 className="page-title">Gestión de Mesas</h1>
          <p className="page-subtitle">Monitorea el estado de las mesas y registra nuevas ubicaciones</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          if (formOpen && editingMesaId !== null) {
            handleCancel();
          } else {
            setFormOpen(!formOpen);
          }
        }}>
          <Plus size={18} />
          {formOpen ? "Ocultar Formulario" : "Nueva Mesa"}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {formOpen && (
        <form onSubmit={handleSubmit} className="glass-panel form-card animate-fade-in">
          <h2 className="form-title">
            {editingMesaId !== null ? "📝 Modificar Mesa" : "🪑 Registrar Nueva Mesa"}
          </h2>
          
          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Número de Mesa</label>
              <input
                type="number"
                min="1"
                className="input-field"
                placeholder="Ej. 5"
                value={numeroMesa}
                onChange={(e) => setNumeroMesa(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Capacidad (Personas)</label>
              <input
                type="number"
                min="1"
                className="input-field"
                placeholder="Ej. 4"
                value={capacidad}
                onChange={(e) => setCapacidad(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Ubicación</label>
              <select
                className="input-field select-field"
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
              >
                <option value="">-- Seleccionar --</option>
                <option value="Salón Principal">Salón Principal</option>
                <option value="Terraza">Terraza</option>
                <option value="Zona VIP">Zona VIP</option>
                <option value="Segundo Piso">Segundo Piso</option>
              </select>
            </div>

            {editingMesaId !== null && (
              <div className="form-group animate-fade-in">
                <label className="form-label">Estado Actual</label>
                <select
                  className="input-field select-field"
                  value={estadoActual}
                  onChange={(e) => setEstadoActual(e.target.value)}
                >
                  <option value="disponible">Disponible</option>
                  <option value="ocupada">Ocupada</option>
                  <option value="reservada">Reservada</option>
                </select>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={handleCancel}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {editingMesaId !== null ? "Guardar Cambios" : "Guardar Mesa"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <span>Cargando plano de distribución...</span>
        </div>
      ) : mesas.length === 0 ? (
        <div className="empty-container glass-panel">
          <h3>No hay mesas registradas</h3>
          <p>Comience a estructurar el plano de su restaurante agregando su primera mesa.</p>
        </div>
      ) : (
        <div className="mesas-grid">
          {mesas.map((mesa) => (
            <div key={mesa.mesaId} className="glass-card mesa-card animate-fade-in">
              <div className="mesa-number">Mesa {mesa.numeroMesa}</div>
              <div className="mesa-location">{mesa.ubicacion || "Salón Principal"}</div>
              <div className="mesa-capacity">Capacidad: {mesa.capacidad} personas</div>
              <div className="mesa-status">{getStatusBadge(mesa.estadoActual)}</div>
              <div style={{ display: "flex", gap: "8px", width: "100%", marginTop: "12px" }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleStartEdit(mesa)}
                  title="Modificar mesa"
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    fontSize: "0.85rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <Pencil size={13} />
                  Modificar
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(mesa.mesaId)}
                  title="Eliminar mesa"
                  style={{
                    padding: "8px 12px",
                    fontSize: "0.85rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    color: "#f87171",
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .view-layout {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .view-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--card-border);
          padding-bottom: 20px;
        }

        .page-subtitle {
          color: var(--text-muted);
          margin-top: 4px;
          font-size: 0.95rem;
        }

        .form-card {
          padding: 24px;
        }

        .form-title {
          font-size: 1.25rem;
          margin-bottom: 20px;
        }

        .form-grid-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
        }

        @media (max-width: 768px) {
          .form-grid-3 {
            grid-template-columns: 1fr;
          }
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
          border-top: 1px solid var(--card-border);
          padding-top: 20px;
        }

        .mesas-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 20px;
        }

        .mesa-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 10px;
          padding: 24px;
        }

        .mesa-number {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-highlight);
        }

        .mesa-location {
          font-size: 0.85rem;
          color: var(--accent-primary);
          font-weight: 600;
        }

        .mesa-capacity {
          font-size: 0.9rem;
          color: var(--text-muted);
        }

        .mesa-status {
          margin-top: 6px;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 60px 0;
          color: var(--text-muted);
        }

        .empty-container {
          padding: 60px;
          text-align: center;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
};
