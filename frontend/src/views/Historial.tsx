import React, { useState, useEffect } from "react";
import { api, API_BASE } from "../api";
import type { VentaEncabezado } from "../api";
import { History, FileText, Receipt, Trash2, ChevronDown, ChevronUp, Download } from "lucide-react";

export const Historial: React.FC = () => {
  const [ventas, setVentas] = useState<VentaEncabezado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedVentaId, setExpandedVentaId] = useState<number | null>(null);

  const loadHistorial = async () => {
    setLoading(true);
    try {
      const data = await api.ventas.getAll();
      // Sort by ventaId descending (most recent first)
      data.sort((a, b) => b.ventaId - a.ventaId);
      setVentas(data);
    } catch (err: any) {
      setError("Error al cargar el historial de ventas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistorial();
  }, []);

  const handleToggleExpand = (id: number) => {
    setExpandedVentaId(expandedVentaId === id ? null : id);
  };

  const handleDeleteVenta = async (id: number) => {
    if (!window.confirm(`¿Está seguro de eliminar de forma permanente la venta #${id}?`)) return;
    try {
      await api.ventas.delete(id);
      loadHistorial();
    } catch (err: any) {
      alert("No se pudo eliminar la venta");
    }
  };

  const handleDownloadPdf = (id: number, type: "ticket" | "factura") => {
    const url = `${API_BASE}/ventas/${id}/${type}`;
    window.open(url, "_blank");
  };

  const formatDate = (isoStr: string) => {
    if (!isoStr) return "";
    return isoStr.substring(0, 16).replace("T", " ");
  };

  const handleDownloadCsv = () => {
    // Generate CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Venta ID,Fecha,Cliente,Mesero,Mesa,Subtotal,Impuestos,Propina,Descuento,Total Final,Método de Pago\n";

    ventas.forEach((v) => {
      const cName = v.cliente ? v.cliente.nombre : "Consumidor Final";
      const eName = v.empleado ? v.empleado.nombre : "N/A";
      const mNum = v.mesa ? `Mesa ${v.mesa.numeroMesa}` : "Para Llevar";
      const payMethod = v.metodoPago || "No especificado";
      csvContent += `${v.ventaId},${formatDate(v.fechaHora)},"${cName}","${eName}","${mNum}",${v.subtotal},${v.impuestos},${v.propina},${v.descuentoAplicado},${v.totalFinal},"${payMethod}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "historial_ventas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in view-layout">
      <div className="view-header">
        <div>
          <h1 className="page-title">Historial de Ventas</h1>
          <p className="page-subtitle">Consulte y descargue comprobantes de pago de transacciones anteriores</p>
        </div>
        <button className="btn btn-secondary" onClick={handleDownloadCsv} disabled={ventas.length === 0}>
          <Download size={16} />
          Exportar CSV
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="glass-panel table-card">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <span>Buscando historial de transacciones...</span>
          </div>
        ) : ventas.length === 0 ? (
          <div className="empty-container">
            <History size={48} className="empty-icon" />
            <h3>No se encontraron registros de ventas</h3>
            <p>Las ventas que realice en la sección POS aparecerán registradas aquí.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: "40px" }}></th>
                  <th>ID Venta</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Mesa</th>
                  <th>Mesero</th>
                  <th>Total Final</th>
                  <th style={{ textAlign: "center" }}>Comprobantes</th>
                  <th style={{ textAlign: "center" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((v) => {
                  const isExpanded = expandedVentaId === v.ventaId;
                  const clienteNombre = v.cliente ? v.cliente.nombre : "Consumidor Final";
                  const mesaStr = v.mesa ? `Mesa ${v.mesa.numeroMesa}` : "Para Llevar";
                  const meseroStr = v.empleado ? v.empleado.nombre : "N/A";

                  return (
                    <React.Fragment key={v.ventaId}>
                      <tr className="main-row" onClick={() => handleToggleExpand(v.ventaId)}>
                        <td>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </td>
                        <td className="font-bold text-white">#{v.ventaId}</td>
                        <td>{formatDate(v.fechaHora)}</td>
                        <td>{clienteNombre}</td>
                        <td>
                          <span className="badge badge-primary">{mesaStr}</span>
                        </td>
                        <td>{meseroStr}</td>
                        <td className="text-success font-bold">${v.totalFinal.toFixed(2)}</td>
                        <td style={{ textAlign: "center" }}>
                          <div className="receipt-actions">
                            <button
                              className="btn btn-secondary btn-compact"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadPdf(v.ventaId, "ticket");
                              }}
                              title="Ver Ticket de Venta"
                            >
                              <Receipt size={13} />
                              Ticket
                            </button>
                            <button
                              className="btn btn-secondary btn-compact"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadPdf(v.ventaId, "factura");
                              }}
                              title="Ver Factura Electrónica"
                            >
                              <FileText size={13} />
                              Factura
                            </button>
                          </div>
                        </td>
                        <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                          <button
                            className="btn-icon btn-icon-danger"
                            onClick={() => handleDeleteVenta(v.ventaId)}
                            title="Eliminar venta permanentemente"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="details-row">
                          <td colSpan={9}>
                            <div className="details-expanded glass-card animate-fade-in">
                              <h4 className="details-title">Productos del Pedido</h4>
                              <table className="details-table">
                                <thead>
                                  <tr>
                                    <th>Producto</th>
                                    <th>Cantidad</th>
                                    <th>P. Unitario</th>
                                    <th>Subtotal</th>
                                    <th>Estado Cocina</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {v.detalles && v.detalles.length > 0 ? (
                                    v.detalles.map((det) => (
                                      <tr key={det.detalleId}>
                                        <td>{det.producto ? det.producto.nombre : "Producto Eliminado"}</td>
                                        <td>{det.cantidad}</td>
                                        <td>${det.precioUnitarioMomento.toFixed(2)}</td>
                                        <td>${(det.precioUnitarioMomento * det.cantidad).toFixed(2)}</td>
                                        <td>
                                          <span className={`badge ${det.estadoCocina === "listo" ? "badge-success" :
                                              det.estadoCocina === "preparacion" ? "badge-warning" : "badge-danger"
                                            }`}>
                                            {det.estadoCocina}
                                          </span>
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan={5} className="text-center text-muted">
                                        No hay información detallada disponible para esta venta.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>

                              <div className="details-summary-grid">
                                 <div>
                                   <span className="summary-label">Subtotal:</span>
                                   <span className="summary-value">${v.subtotal.toFixed(2)}</span>
                                 </div>
                                 <div>
                                   <span className="summary-label">Impuestos:</span>
                                   <span className="summary-value">${v.impuestos.toFixed(2)}</span>
                                 </div>
                                 <div>
                                   <span className="summary-label">Método de Pago:</span>
                                   <span className="summary-value" style={{ textTransform: "capitalize", color: v.metodoPago === "efectivo" ? "var(--accent-success)" : "var(--accent-primary)" }}>
                                     {v.metodoPago || "No especificado"}
                                   </span>
                                 </div>
                                {v.descuentoAplicado > 0 && (
                                  <div>
                                    <span className="summary-label text-danger">Descuento:</span>
                                    <span className="summary-value text-danger">-${v.descuentoAplicado.toFixed(2)}</span>
                                  </div>
                                )}
                                {v.propina > 0 && (
                                  <div>
                                    <span className="summary-label text-success">Propina:</span>
                                    <span className="summary-value text-success">+${v.propina.toFixed(2)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
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

        .table-card {
          padding: 20px;
        }

        .main-row {
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .main-row:hover td {
          background: rgba(255, 255, 255, 0.04) !important;
        }

        .receipt-actions {
          display: flex;
          gap: 6px;
          justify-content: center;
        }

        .btn-compact {
          padding: 6px 12px;
          font-size: 0.75rem;
          gap: 4px;
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

        .details-row td {
          padding: 0 !important;
          background: rgba(0, 0, 0, 0.1) !important;
        }

        .details-expanded {
          margin: 16px 20px;
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .details-title {
          font-size: 0.95rem;
          color: var(--text-highlight);
        }

        .details-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
          text-align: left;
        }

        .details-table th {
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: 8px 12px;
          color: var(--text-muted);
          font-weight: 600;
        }

        .details-table td {
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          padding: 10px 12px;
          color: var(--text-main);
        }

        .details-table tr:last-child td {
          border-bottom: none;
        }

        .details-summary-grid {
          display: flex;
          justify-content: flex-end;
          gap: 24px;
          border-top: 1px dashed rgba(255, 255, 255, 0.08);
          padding-top: 14px;
          font-size: 0.85rem;
        }

        .details-summary-grid > div {
          display: flex;
          gap: 8px;
        }

        .summary-label {
          color: var(--text-muted);
        }

        .summary-value {
          font-weight: 700;
          color: var(--text-highlight);
        }

        .text-danger {
          color: #f87171;
        }
        .text-success {
          color: var(--accent-success);
        }
        .text-white {
          color: var(--text-highlight);
        }
        .font-bold {
          font-weight: 600;
        }
        .text-center {
          text-align: center;
        }
      `}</style>
    </div>
  );
};
