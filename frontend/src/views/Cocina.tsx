import React, { useState, useEffect } from "react";
import { api, API_BASE } from "../api";
import type { VentaEncabezado } from "../api";
import { Flame, CheckCircle2, Clock, RotateCw, FileText, Receipt } from "lucide-react";

export const Cocina: React.FC = () => {
  const [ventas, setVentas] = useState<VentaEncabezado[]>([]);
  const [error, setError] = useState("");

  const loadCocinaData = async () => {
    try {
      const data = await api.ventas.getAll();
      setVentas(data);
    } catch (err: any) {
      setError("Error al actualizar comandas");
    }
  };

  useEffect(() => {
    loadCocinaData();
    // Auto refresh every 5 seconds
    const interval = setInterval(loadCocinaData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (detalleId: number, nextStatus: string) => {
    try {
      await api.ventas.updateCocina(detalleId, nextStatus);
      loadCocinaData();
    } catch (err: any) {
      alert("No se pudo actualizar el estado de cocina");
    }
  };

  // Grouping details for Kanban columns
  const pendientes: { venta: VentaEncabezado; detalle: any }[] = [];
  const enPreparacion: { venta: VentaEncabezado; detalle: any }[] = [];
  const listosPorVenta: VentaEncabezado[] = [];

  ventas.forEach((v) => {
    const detalles = v.detalles || [];
    if (detalles.length === 0) return;

    let todosListos = true;
    detalles.forEach((d) => {
      if (d.estadoCocina === "pendiente") {
        pendientes.push({ venta: v, detalle: d });
        todosListos = false;
      } else if (d.estadoCocina === "preparacion") {
        enPreparacion.push({ venta: v, detalle: d });
        todosListos = false;
      } else if (d.estadoCocina !== "listo") {
        todosListos = false;
      }
    });

    if (todosListos) {
      listosPorVenta.push(v);
    }
  });

  const formatDate = (isoStr: string) => {
    if (!isoStr) return "";
    return isoStr.substring(0, 16).replace("T", " ");
  };

  const handleDownloadPdf = (ventaId: number, type: "ticket" | "factura") => {
    const url = `${API_BASE}/ventas/${ventaId}/${type}`;
    window.open(url, "_blank");
  };

  return (
    <div className="animate-fade-in view-layout">
      <div className="view-header">
        <div>
          <h1 className="page-title">Tablero de Cocina</h1>
          <p className="page-subtitle">Monitoreo en tiempo real de comandas de platos y bebidas (Auto-refresh activo)</p>
        </div>
        <button className="btn btn-secondary btn-icon-only" onClick={loadCocinaData}>
          <RotateCw size={18} />
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="kanban-board">
        {/* Column 1: Pendientes */}
        <div className="kanban-column">
          <div className="column-header column-header-pending">
            <Clock size={16} />
            <h3>🕒 Pendientes ({pendientes.length})</h3>
          </div>

          <div className="comandas-list">
            {pendientes.length === 0 ? (
              <div className="column-empty">Ninguna comanda en cola</div>
            ) : (
              pendientes.map(({ venta, detalle }) => (
                <div key={detalle.detalleId} className="comanda-card glass-panel animate-fade-in">
                  <div className="comanda-card-title">
                    {detalle.producto ? detalle.producto.nombre : "Producto"}
                    <span className="qty-tag">x{detalle.cantidad}</span>
                  </div>
                  <div className="comanda-meta">
                    <span>📍 Mesa: {venta.mesa ? venta.mesa.numeroMesa : "Llevar"}</span>
                    <span>🕒 {formatDate(venta.fechaHora)}</span>
                  </div>
                  <button
                    className="btn btn-primary btn-action"
                    onClick={() => handleUpdateStatus(detalle.detalleId, "preparacion")}
                  >
                    🧑‍🍳 Iniciar Preparación
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: En Preparacion */}
        <div className="kanban-column">
          <div className="column-header column-header-prep">
            <Flame size={16} />
            <h3>🔥 En Preparación ({enPreparacion.length})</h3>
          </div>

          <div className="comandas-list">
            {enPreparacion.length === 0 ? (
              <div className="column-empty">Ningún plato en preparación</div>
            ) : (
              enPreparacion.map(({ venta, detalle }) => (
                <div key={detalle.detalleId} className="comanda-card glass-panel card-active animate-fade-in">
                  <div className="comanda-card-title">
                    {detalle.producto ? detalle.producto.nombre : "Producto"}
                    <span className="qty-tag">x{detalle.cantidad}</span>
                  </div>
                  <div className="comanda-meta">
                    <span>📍 Mesa: {venta.mesa ? venta.mesa.numeroMesa : "Llevar"}</span>
                    <span>🕒 {formatDate(venta.fechaHora)}</span>
                  </div>
                  <button
                    className="btn btn-success btn-action"
                    onClick={() => handleUpdateStatus(detalle.detalleId, "listo")}
                  >
                    ✅ Listo para Servir
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Listos / Facturacion */}
        <div className="kanban-column">
          <div className="column-header column-header-ready">
            <CheckCircle2 size={16} />
            <h3>✅ Listos / Tickets ({listosPorVenta.length})</h3>
          </div>

          <div className="comandas-list">
            {listosPorVenta.length === 0 ? (
              <div className="column-empty">No hay órdenes listas</div>
            ) : (
              listosPorVenta.map((v) => (
                <div key={v.ventaId} className="comanda-card glass-panel card-finished animate-fade-in">
                  <div className="comanda-card-title text-success">
                    Pedido Nro: {v.ventaId}
                  </div>
                  <div className="comanda-meta">
                    <span>📍 Mesa: {v.mesa ? v.mesa.numeroMesa : "Llevar"}</span>
                    <span>🕒 {formatDate(v.fechaHora)}</span>
                    <span className="text-white font-bold">Total: ${v.totalFinal.toFixed(2)}</span>
                  </div>
                  <div className="pdf-actions">
                    <button
                      className="btn btn-secondary btn-pdf"
                      onClick={() => handleDownloadPdf(v.ventaId, "ticket")}
                    >
                      <Receipt size={14} />
                      Ticket
                    </button>
                    <button
                      className="btn btn-secondary btn-pdf"
                      onClick={() => handleDownloadPdf(v.ventaId, "factura")}
                    >
                      <FileText size={14} />
                      Factura
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
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

        .btn-icon-only {
          padding: 10px;
          border-radius: 8px;
        }

        .kanban-board {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 24px;
          height: calc(100vh - 180px);
          min-height: 500px;
        }

        @media (max-width: 900px) {
          .kanban-board {
            grid-template-columns: 1fr;
            height: auto;
          }
        }

        .kanban-column {
          display: flex;
          flex-direction: column;
          background: rgba(17, 24, 39, 0.4);
          border: 1px solid var(--card-border);
          border-radius: 14px;
          overflow: hidden;
          height: 100%;
        }

        .column-header {
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--text-highlight);
          border-bottom: 1px solid var(--card-border);
        }

        .column-header h3 {
          font-size: 1rem;
          font-weight: 700;
        }

        .column-header-pending {
          border-left: 4px solid var(--accent-primary);
        }

        .column-header-prep {
          border-left: 4px solid var(--accent-warning);
        }

        .column-header-ready {
          border-left: 4px solid var(--accent-success);
        }

        .comandas-list {
          flex-grow: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .column-empty {
          color: var(--text-muted);
          font-size: 0.85rem;
          text-align: center;
          padding: 24px 0;
          font-style: italic;
        }

        .comanda-card {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .card-active {
          border-color: rgba(245, 158, 11, 0.2);
          box-shadow: 0 4px 12px -6px rgba(245, 158, 11, 0.3);
        }

        .card-finished {
          border-color: rgba(16, 185, 129, 0.2);
          box-shadow: 0 4px 12px -6px rgba(16, 185, 129, 0.3);
        }

        .comanda-card-title {
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--text-highlight);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .qty-tag {
          font-size: 0.8rem;
          font-weight: 800;
          background: rgba(255, 255, 255, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
          color: var(--accent-primary);
        }

        .comanda-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .btn-action {
          padding: 8px 16px;
          font-size: 0.85rem;
          font-weight: 600;
          width: 100%;
        }

        .pdf-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .btn-pdf {
          padding: 8px;
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .text-success {
          color: var(--accent-success);
        }
      `}</style>
    </div>
  );
};
