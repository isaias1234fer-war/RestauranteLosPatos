import React, { useState, useEffect } from "react";
import { api } from "../api";
import type { Producto, Proveedor } from "../api";
import { Plus, Trash2, Package, Pencil } from "lucide-react";

export const Catalogo: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form states
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [subcategoria, setSubcategoria] = useState("");
  const [precioVenta, setPrecioVenta] = useState("");
  const [costoProduccion, setCostoProduccion] = useState("");
  const [tiempoPrep, setTiempoPrep] = useState("00:15:00");
  const [proveedorId, setProveedorId] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingProductoId, setEditingProductoId] = useState<number | null>(null);

  // Table filter states
  const [filterCategoria, setFilterCategoria] = useState("");
  const [filterSubcategoria, setFilterSubcategoria] = useState("");

  const uniqueCategorias = Array.from(new Set(productos.map(p => p.categoria || "General"))).sort();
  const uniqueSubcategorias = Array.from(new Set(productos.map(p => p.subcategoria).filter(Boolean))).sort();

  const filteredProductos = productos.filter(prod => {
    const matchesCategoria = !filterCategoria || (prod.categoria || "General") === filterCategoria;
    const matchesSubcategoria = !filterSubcategoria || prod.subcategoria === filterSubcategoria;
    return matchesCategoria && matchesSubcategoria;
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, provs] = await Promise.all([
        api.productos.getAll(),
        api.proveedores.getAll(),
      ]);
      setProductos(prods);
      setProveedores(provs);
    } catch (err: any) {
      setError("Error al cargar datos del catálogo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !precioVenta) {
      setError("Nombre y Precio de Venta son requeridos");
      return;
    }

    try {
      const data = {
        nombre,
        categoria,
        subcategoria,
        precioVenta: parseFloat(precioVenta),
        costoProduccion: costoProduccion ? parseFloat(costoProduccion) : null,
        tiempoPreparacionEst: tiempoPrep,
        proveedorId: proveedorId ? parseInt(proveedorId) : null,
      };

      if (editingProductoId !== null) {
        await api.productos.update(editingProductoId, data);
      } else {
        await api.productos.create(data);
      }
      
      // Reset form
      setNombre("");
      setCategoria("");
      setSubcategoria("");
      setPrecioVenta("");
      setCostoProduccion("");
      setTiempoPrep("00:15:00");
      setProveedorId("");
      setEditingProductoId(null);
      setFormOpen(false);
      setError("");
      loadData();
    } catch (err: any) {
      setError(err.message || "Error al guardar el producto");
    }
  };

  const handleStartEdit = (prod: Producto) => {
    setNombre(prod.nombre || "");
    setCategoria(prod.categoria || "");
    setSubcategoria(prod.subcategoria || "");
    setPrecioVenta(prod.precioVenta !== undefined ? prod.precioVenta.toString() : "");
    setCostoProduccion(prod.costoProduccion !== undefined && prod.costoProduccion !== null ? prod.costoProduccion.toString() : "");
    setTiempoPrep(prod.tiempoPreparacionEst || "00:15:00");
    setProveedorId(prod.proveedor ? prod.proveedor.proveedorId.toString() : "");
    setEditingProductoId(prod.productoId);
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setNombre("");
    setCategoria("");
    setSubcategoria("");
    setPrecioVenta("");
    setCostoProduccion("");
    setTiempoPrep("00:15:00");
    setProveedorId("");
    setEditingProductoId(null);
    setFormOpen(false);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Está seguro de eliminar este producto del catálogo?")) return;
    try {
      await api.productos.delete(id);
      loadData();
    } catch (err: any) {
      alert(err.message || "No se pudo eliminar el producto");
    }
  };

  return (
    <div className="animate-fade-in view-layout">
      <div className="view-header">
        <div>
          <h1 className="page-title">Gestión de Catálogo</h1>
          <p className="page-subtitle">Administra los platos, insumos y catálogo general del restaurante</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          if (formOpen && editingProductoId !== null) {
            handleCancel();
          } else {
            setFormOpen(!formOpen);
          }
        }}>
          <Plus size={18} />
          {formOpen ? "Ocultar Formulario" : "Nuevo Producto"}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {formOpen && (
        <form onSubmit={handleSubmit} className="glass-panel form-card animate-fade-in">
          <h2 className="form-title">
            {editingProductoId !== null ? "📝 Modificar Producto" : "➕ Registrar Nuevo Producto"}
          </h2>
          
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Nombre del Producto</label>
              <input
                type="text"
                className="input-field"
                placeholder="Ej. Lomo Saltado"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Categoría</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ej. Platos de Fondo"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Subcategoría</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ej. Carnes"
                  value={subcategoria}
                  onChange={(e) => setSubcategoria(e.target.value)}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Precio de Venta ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input-field"
                  placeholder="0.00"
                  value={precioVenta}
                  onChange={(e) => setPrecioVenta(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Costo de Producción ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input-field"
                  placeholder="0.00"
                  value={costoProduccion}
                  onChange={(e) => setCostoProduccion(e.target.value)}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Tiempo Prep. Estimado (HH:MM:SS)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="00:15:00"
                  value={tiempoPrep}
                  onChange={(e) => setTiempoPrep(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Proveedor</label>
                <select
                  className="input-field select-field"
                  value={proveedorId}
                  onChange={(e) => setProveedorId(e.target.value)}
                >
                  <option value="">-- Sin Proveedor --</option>
                  {proveedores.map((p) => (
                    <option key={p.proveedorId} value={p.proveedorId}>
                      {p.nombre} ({p.tipoInsumo || "Insumos"})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={handleCancel}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {editingProductoId !== null ? "Guardar Cambios" : "Guardar Producto"}
            </button>
          </div>
        </form>
      )}

      <div className="glass-panel table-card">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <span>Cargando productos del catálogo...</span>
          </div>
        ) : productos.length === 0 ? (
          <div className="empty-container">
            <Package size={48} className="empty-icon" />
            <h3>No hay productos registrados</h3>
            <p>Comience a agregar platos y bebidas a su catálogo.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Subcategoría</th>
                  <th>Precio Venta</th>
                  <th>Costo Prod.</th>
                  <th>Tiempo Prep.</th>
                  <th>Proveedor</th>
                  <th style={{ textAlign: "center" }}>Acciones</th>
                </tr>
                <tr className="filter-row">
                  <td></td>
                  <td>
                    <select 
                      className="filter-select"
                      value={filterCategoria}
                      onChange={(e) => setFilterCategoria(e.target.value)}
                    >
                      <option value="">Todas las categorías</option>
                      {uniqueCategorias.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select 
                      className="filter-select"
                      value={filterSubcategoria}
                      onChange={(e) => setFilterSubcategoria(e.target.value)}
                    >
                      <option value="">Todas las subcategorías</option>
                      {uniqueSubcategorias.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              </thead>
              <tbody>
                {filteredProductos.map((prod) => (
                  <tr key={prod.productoId}>
                    <td className="font-bold text-white">{prod.nombre}</td>
                    <td>
                      <span className="badge badge-primary">{prod.categoria || "General"}</span>
                    </td>
                    <td>{prod.subcategoria || "-"}</td>
                    <td className="text-success font-bold">${prod.precioVenta.toFixed(2)}</td>
                    <td>{prod.costoProduccion ? `$${prod.costoProduccion.toFixed(2)}` : "-"}</td>
                    <td>{prod.tiempoPreparacionEst || "-"}</td>
                    <td>{prod.proveedor ? prod.proveedor.nombre : "-"}</td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                        <button
                          className="btn-icon btn-icon-warning"
                          onClick={() => handleStartEdit(prod)}
                          title="Modificar producto"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="btn-icon btn-icon-danger"
                          onClick={() => handleDelete(prod.productoId)}
                          title="Eliminar producto"
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

        .text-success {
          color: var(--accent-success);
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

        .filter-row td {
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.01);
          border-bottom: 1px solid var(--card-border);
        }

        .filter-select {
          width: 100%;
          background: #ffffff;
          border: 1px solid var(--card-border);
          border-radius: 6px;
          padding: 6px 12px;
          color: var(--text-main);
          font-size: 0.85rem;
          font-family: inherit;
          outline: none;
          transition: all 0.2s ease;
        }

        .filter-select:focus {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
        }
      `}</style>
    </div>
  );
};
