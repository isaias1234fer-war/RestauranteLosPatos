import React, { useState, useEffect } from "react";
import { api } from "../api";
import type { Cliente } from "../api";
import { Plus, Trash2, Search, User, Pencil } from "lucide-react";

export const Clientes: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Form states
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [segmento, setSegmento] = useState("nuevo");
  const [preferencias, setPreferencias] = useState("");
  const [metodoPago, setMetodoPago] = useState("tarjeta");
  const [formOpen, setFormOpen] = useState(false);
  const [editingClienteId, setEditingClienteId] = useState<number | null>(null);

  const loadClientes = async (term?: string) => {
    setLoading(true);
    try {
      const data = await api.clientes.getAll(term);
      setClientes(data);
    } catch (err: any) {
      setError("Error al cargar los clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientes();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    loadClientes(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre) {
      setError("El nombre es requerido");
      return;
    }

    const clientData = {
      nombre,
      email: email || null as any,
      segmento,
      preferencias: preferencias || null as any,
      metodoPagoHabitual: metodoPago,
    };

    try {
      if (editingClienteId !== null) {
        await api.clientes.update(editingClienteId, clientData);
      } else {
        await api.clientes.create(clientData);
      }

      // Reset form
      setNombre("");
      setEmail("");
      setSegmento("nuevo");
      setPreferencias("");
      setMetodoPago("tarjeta");
      setEditingClienteId(null);
      setFormOpen(false);
      setError("");
      loadClientes();
    } catch (err: any) {
      setError(err.message || "Error al guardar el cliente");
    }
  };

  const handleStartEdit = (cliente: Cliente) => {
    setNombre(cliente.nombre || "");
    setEmail(cliente.email || "");
    setSegmento(cliente.segmento || "nuevo");
    setPreferencias(cliente.preferencias || "");
    setMetodoPago(cliente.metodoPagoHabitual || "tarjeta");
    setEditingClienteId(cliente.clienteId);
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setNombre("");
    setEmail("");
    setSegmento("nuevo");
    setPreferencias("");
    setMetodoPago("tarjeta");
    setEditingClienteId(null);
    setFormOpen(false);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Está seguro de eliminar este cliente?")) return;
    try {
      await api.clientes.delete(id);
      loadClientes();
    } catch (err: any) {
      alert(err.message || "No se pudo eliminar el cliente");
    }
  };

  return (
    <div className="animate-fade-in view-layout">
      <div className="view-header">
        <div>
          <h1 className="page-title">Gestión de Clientes</h1>
          <p className="page-subtitle">Visualiza, busca y administra el historial y preferencias de tus clientes</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          if (formOpen && editingClienteId !== null) {
            handleCancel();
          } else {
            setFormOpen(!formOpen);
          }
        }}>
          <Plus size={18} />
          {formOpen ? "Ocultar Formulario" : "Nuevo Cliente"}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="search-bar-container glass-panel">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Buscar clientes por nombre o correo..."
          value={search}
          onChange={handleSearchChange}
        />
      </div>

      {formOpen && (
        <form onSubmit={handleSubmit} className="glass-panel form-card animate-fade-in">
          <h2 className="form-title">
            {editingClienteId !== null ? "📝 Modificar Cliente" : "👥 Registrar Nuevo Cliente"}
          </h2>
          
          <div className="form-grid">
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Nombre Completo</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ej. María Rojas"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Correo Electrónico</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="Ej. maria@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Segmentación</label>
                <select
                  className="input-field select-field"
                  value={segmento}
                  onChange={(e) => setSegmento(e.target.value)}
                >
                  <option value="nuevo">Nuevo</option>
                  <option value="recurrente">Recurrente</option>
                  <option value="VIP">VIP</option>
                  <option value="corporativo">Corporativo</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Método de Pago Habitual</label>
                <select
                  className="input-field select-field"
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta de Crédito/Débito</option>
                  <option value="transferencia">Transferencia Bancaria</option>
                  <option value="yape/plin">Yape / Plin</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Preferencias / Notas Especiales</label>
              <textarea
                className="input-field textarea-field"
                rows={3}
                placeholder="Ej. Alérgica a los mariscos, prefiere mesa en la terraza..."
                value={preferencias}
                onChange={(e) => setPreferencias(e.target.value)}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={handleCancel}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {editingClienteId !== null ? "Guardar Cambios" : "Guardar Cliente"}
            </button>
          </div>
        </form>
      )}

      <div className="glass-panel table-card">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <span>Buscando en el registro de clientes...</span>
          </div>
        ) : clientes.length === 0 ? (
          <div className="empty-container">
            <User size={48} className="empty-icon" />
            <h3>No se encontraron clientes</h3>
            <p>Registre clientes para personalizar sus servicios y emitir facturas con facilidad.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Segmento</th>
                  <th>Método Pago</th>
                  <th>Preferencias / Notas</th>
                  <th style={{ textAlign: "center" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <tr key={cliente.clienteId}>
                    <td className="font-bold text-white">{cliente.nombre}</td>
                    <td>{cliente.email || "-"}</td>
                    <td>
                      <span className={`badge ${
                        cliente.segmento === "VIP" ? "badge-warning" : 
                        cliente.segmento === "recurrente" ? "badge-primary" : "badge-success"
                      }`}>
                        {cliente.segmento}
                      </span>
                    </td>
                    <td>{cliente.metodoPagoHabitual || "tarjeta"}</td>
                    <td className="text-muted" style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {cliente.preferencias || "-"}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                        <button
                          className="btn-icon btn-icon-warning"
                          onClick={() => handleStartEdit(cliente)}
                          title="Modificar cliente"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="btn-icon btn-icon-danger"
                          onClick={() => handleDelete(cliente.clienteId)}
                          title="Eliminar cliente"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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

        .search-bar-container {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
        }

        .search-icon {
          color: var(--text-muted);
        }

        .search-input {
          background: transparent;
          border: none;
          color: var(--text-main);
          font-size: 0.95rem;
          width: 100%;
          outline: none;
          font-family: inherit;
        }

        .form-card {
          padding: 24px;
        }

        .form-title {
          font-size: 1.25rem;
          margin-bottom: 20px;
        }

        .form-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        @media (max-width: 600px) {
          .form-grid-2 {
            grid-template-columns: 1fr;
          }
        }

        .textarea-field {
          font-family: inherit;
          resize: vertical;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
          border-top: 1px solid var(--card-border);
          padding-top: 20px;
        }

        .table-card {
          padding: 20px;
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
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 60px 20px;
          color: var(--text-muted);
        }

        .empty-icon {
          color: rgba(255, 255, 255, 0.1);
          margin-bottom: 16px;
        }

        .empty-container h3 {
          margin-bottom: 8px;
        }

        .text-white {
          color: var(--text-highlight);
        }

        .font-bold {
          font-weight: 600;
        }

        .btn-icon {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: 6px;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .btn-icon-danger {
          color: #f87171;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.15);
        }

        .btn-icon-danger:hover {
          background: var(--accent-danger);
          color: white;
          border-color: var(--accent-danger);
        }

        .btn-icon-warning {
          color: #fbbf24;
          background: rgba(245, 158, 11, 0.08);
          border: 1px solid rgba(245, 158, 11, 0.15);
        }

        .btn-icon-warning:hover {
          background: var(--accent-warning);
          color: white;
          border-color: var(--accent-warning);
        }
      `}</style>
    </div>
  );
};
