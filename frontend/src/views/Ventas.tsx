import React, { useState, useEffect } from "react";
import { api } from "../api";
import type { Mesa, Cliente, Producto, Usuario } from "../api";
import { ShoppingCart, User, Utensils, Trash2, Plus, Minus, Search, Tag, Calculator, CreditCard, Banknote, X } from "lucide-react";

interface VentasProps {
  usuario: Usuario;
}

interface CartItem {
  producto: Producto;
  cantidad: number;
  precioUnitario: number;
}

export const Ventas: React.FC<VentasProps> = ({ usuario }) => {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Cart & POS states
  const [selectedMesa, setSelectedMesa] = useState("");
  const [selectedCliente, setSelectedCliente] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [propina, setPropina] = useState("");
  const [descuento, setDescuento] = useState("");
  const [filterCategory, setFilterCategory] = useState("todos");
  const [searchProduct, setSearchProduct] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "tarjeta">("efectivo");
  const [cashReceived, setCashReceived] = useState("");

  // New Client Modal states
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientNombre, setClientNombre] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientSegmento, setClientSegmento] = useState("nuevo");
  const [clientMetodoPago, setClientMetodoPago] = useState("tarjeta");
  const [clientPreferencias, setClientPreferencias] = useState("");
  const [clientError, setClientError] = useState("");

  // Load POS options
  useEffect(() => {
    const loadPOSData = async () => {
      setLoading(true);
      try {
        const [mList, cList, pList] = await Promise.all([
          api.mesas.getAll(),
          api.clientes.getAll(),
          api.productos.getAll(),
        ]);
        setMesas(mList);
        setClientes(cList);
        setProductos(pList);
      } catch (err: any) {
        setError("Error al cargar la información operativa");
      } finally {
        setLoading(false);
      }
    };
    loadPOSData();
  }, []);

  const categories = ["todos", ...Array.from(new Set(productos.map((p) => p.categoria).filter(Boolean)))];

  const addToCart = (prod: Producto) => {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.producto.productoId === prod.productoId);
      if (idx > -1) {
        const newCart = [...prev];
        newCart[idx].cantidad += 1;
        return newCart;
      }
      return [...prev, { producto: prod, cantidad: 1, precioUnitario: prod.precioVenta }];
    });
  };

  const updateQuantity = (productoId: number, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.producto.productoId === productoId) {
            const next = item.cantidad + delta;
            return { ...item, cantidad: next };
          }
          return item;
        })
        .filter((item) => item.cantidad > 0);
    });
  };

  const removeFromCart = (productoId: number) => {
    setCart((prev) => prev.filter((item) => item.producto.productoId !== productoId));
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.precioUnitario * item.cantidad, 0);
  const impuestos = subtotal * 0.18; // 18% IGV Peruano
  const valPropina = parseFloat(propina) || 0;
  const valDescuento = parseFloat(descuento) || 0;
  const total = subtotal + impuestos + valPropina - valDescuento;

  const handleOpenPaymentModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setError("El carrito de compras está vacío");
      return;
    }
    setError("");
    setSuccess("");
    setPaymentMethod("efectivo");
    setCashReceived("");
    setShowPaymentModal(true);
  };

  const handleFinalizePayment = async () => {
    try {
      const detalles = cart.map((item) => ({
        productoId: item.producto.productoId,
        cantidad: item.cantidad,
        precioUnitarioMomento: item.precioUnitario,
        tiempoPreparacionReal: item.producto.tiempoPreparacionEst || "00:15:00",
        estadoCocina: "pendiente",
      }));

      const data = {
        clienteId: selectedCliente ? parseInt(selectedCliente) : null,
        empleadoId: usuario.usuarioId, // Empleado logueado
        mesaId: selectedMesa ? parseInt(selectedMesa) : null,
        subtotal: subtotal,
        impuestos: impuestos,
        propina: valPropina,
        descuentoAplicado: valDescuento,
        totalFinal: total,
        metodoPago: paymentMethod,
        detalles: detalles,
      };

      const res = await api.ventas.create(data);
      setSuccess(`¡Venta #${res.ventaId} registrada con éxito!`);
      // Reset
      setCart([]);
      setSelectedMesa("");
      setSelectedCliente("");
      setPropina("");
      setDescuento("");
      setError("");
      setShowPaymentModal(false);
      
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Error al procesar la venta");
      setShowPaymentModal(false);
    }
  };

  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientNombre) {
      setClientError("El nombre es requerido");
      return;
    }

    const clientData = {
      nombre: clientNombre,
      email: clientEmail || null as any,
      segmento: clientSegmento,
      preferencias: clientPreferencias || null as any,
      metodoPagoHabitual: clientMetodoPago,
    };

    try {
      const newClient = await api.clientes.create(clientData);
      // reload the client list
      const cList = await api.clientes.getAll();
      setClientes(cList);
      
      // select the newly created client
      if (newClient && newClient.clienteId) {
        setSelectedCliente(newClient.clienteId.toString());
      }
      
      // close modal and reset fields
      setShowClientModal(false);
      setClientNombre("");
      setClientEmail("");
      setClientSegmento("nuevo");
      setClientPreferencias("");
      setClientMetodoPago("tarjeta");
      setClientError("");
    } catch (err: any) {
      setClientError(err.message || "Error al guardar el cliente");
    }
  };

  const filteredProducts = productos.filter((p) => {
    const matchesCat = filterCategory === "todos" || p.categoria === filterCategory;
    const matchesSearch = p.nombre.toLowerCase().includes(searchProduct.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="pos-layout animate-fade-in">
      <div className="checkout-panel glass-panel">
        <div className="panel-header">
          <ShoppingCart size={20} className="text-primary" />
          <h2>Detalle del Pedido</h2>
        </div>

        {error && <div className="error-banner">{error}</div>}
        {success && <div className="success-banner">{success}</div>}

        <form onSubmit={handleOpenPaymentModal} className="pos-form">
          <div className="pos-meta">
            <div className="form-group">
              <label className="form-label">
                <Utensils size={14} style={{ marginRight: 6 }} /> Mesa
              </label>
              <select
                className="input-field select-field"
                value={selectedMesa}
                onChange={(e) => setSelectedMesa(e.target.value)}
              >
                <option value="">-- Para Llevar --</option>
                {mesas.map((m) => (
                  <option key={m.mesaId} value={m.mesaId}>
                    Mesa {m.numeroMesa} ({m.estadoActual})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                <User size={14} style={{ marginRight: 6 }} /> Cliente
              </label>
              <select
                className="input-field select-field"
                value={selectedCliente}
                onChange={(e) => {
                  if (e.target.value === "new_client") {
                    setClientNombre("");
                    setClientEmail("");
                    setClientSegmento("nuevo");
                    setClientMetodoPago("tarjeta");
                    setClientPreferencias("");
                    setClientError("");
                    setShowClientModal(true);
                  } else {
                    setSelectedCliente(e.target.value);
                  }
                }}
              >
                <option value="">-- Consumidor Final --</option>
                <option value="new_client" style={{ fontWeight: "bold", color: "var(--accent-primary)" }}>
                  + Registrar Nuevo Cliente
                </option>
                {clientes.map((c) => (
                  <option key={c.clienteId} value={c.clienteId}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="cart-list">
            {cart.length === 0 ? (
              <div className="empty-cart">
                <ShoppingCart size={32} className="empty-cart-icon" />
                <p>El pedido está vacío. Seleccione productos de la lista.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.producto.productoId} className="cart-item glass-card">
                  <div className="cart-item-info">
                    <span className="cart-item-name">{item.producto.nombre}</span>
                    <span className="cart-item-price">${item.precioUnitario.toFixed(2)} c/u</span>
                  </div>
                  <div className="cart-item-controls">
                    <button type="button" className="btn-qty" onClick={() => updateQuantity(item.producto.productoId, -1)}>
                      <Minus size={14} />
                    </button>
                    <span className="cart-item-qty">{item.cantidad}</span>
                    <button type="button" className="btn-qty" onClick={() => addToCart(item.producto)}>
                      <Plus size={14} />
                    </button>
                    <button type="button" className="btn-delete" onClick={() => removeFromCart(item.producto.productoId)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pos-addons border-top">
            <div className="form-group">
              <label className="form-label">Descuento ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="input-field"
                value={descuento}
                onChange={(e) => setDescuento(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Propina ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="input-field"
                value={propina}
                onChange={(e) => setPropina(e.target.value)}
              />
            </div>
          </div>

          <div className="totals-panel border-top">
            <div className="total-row">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Impuestos (18%):</span>
              <span>${impuestos.toFixed(2)}</span>
            </div>
            {valDescuento > 0 && (
              <div className="total-row text-danger">
                <span>Descuento:</span>
                <span>-${valDescuento.toFixed(2)}</span>
              </div>
            )}
            {valPropina > 0 && (
              <div className="total-row text-success">
                <span>Propina:</span>
                <span>+${valPropina.toFixed(2)}</span>
              </div>
            )}
            <div className="total-row grand-total">
              <span>Total Final:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <button type="submit" className="btn btn-primary submit-order-btn" disabled={cart.length === 0}>
            <Calculator size={18} />
            <span>Confirmar y Cobrar</span>
          </button>
        </form>
      </div>

      <div className="products-panel glass-panel">
        <div className="panel-header search-header">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar plato o bebida..."
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
            />
          </div>
        </div>

        <div className="category-tabs">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-tab ${filterCategory === cat ? "active" : ""}`}
              onClick={() => setFilterCategory(cat)}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <span>Cargando catálogo operativo...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-container">
            <Tag size={36} className="empty-icon" />
            <p>No se encontraron productos coincidentes.</p>
          </div>
        ) : (
          <div className="menu-grid">
            {filteredProducts.map((prod) => (
              <div key={prod.productoId} className="glass-card menu-card animate-fade-in" onClick={() => addToCart(prod)}>
                <div className="menu-card-category">{prod.categoria}</div>
                <h3 className="menu-card-title">{prod.nombre}</h3>
                <div className="menu-card-footer">
                  <span className="menu-card-price">${prod.precioVenta.toFixed(2)}</span>
                  <button className="btn-add-item">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .pos-layout {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 24px;
          height: calc(100vh - 60px);
          overflow: hidden;
        }

        @media (max-width: 1024px) {
          .pos-layout {
            grid-template-columns: 1fr;
            height: auto;
            overflow: visible;
          }
        }

        .checkout-panel {
          display: flex;
          flex-direction: column;
          padding: 20px;
          height: 100%;
          overflow-y: auto;
        }

        .products-panel {
          display: flex;
          flex-direction: column;
          padding: 20px;
          height: 100%;
          overflow: hidden;
        }

        .panel-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--card-border);
        }

        .text-primary {
          color: var(--accent-primary);
        }

        .pos-form {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          gap: 16px;
        }

        .pos-meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .cart-list {
          flex-grow: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-height: 150px;
          padding-right: 4px;
        }

        .empty-cart {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          margin-auto: auto;
          color: var(--text-muted);
          padding: 40px 10px;
        }

        .empty-cart-icon {
          color: rgba(255, 255, 255, 0.05);
          margin-bottom: 12px;
        }

        .cart-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          gap: 12px;
        }

        .cart-item-info {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .cart-item-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-highlight);
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }

        .cart-item-price {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .cart-item-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-qty {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-main);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .btn-qty:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .cart-item-qty {
          font-size: 0.9rem;
          font-weight: 700;
          min-width: 16px;
          text-align: center;
        }

        .btn-delete {
          border: none;
          background: transparent;
          color: #f87171;
          cursor: pointer;
          padding: 4px;
        }
        .btn-delete:hover {
          color: var(--accent-danger);
        }

        .pos-addons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .border-top {
          border-top: 1px solid var(--card-border);
          padding-top: 16px;
        }

        .totals-panel {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
          color: var(--text-muted);
        }

        .grand-total {
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--text-highlight);
          margin-top: 4px;
          border-top: 1px dashed rgba(255, 255, 255, 0.1);
          padding-top: 8px;
        }

        .submit-order-btn {
          height: 46px;
          width: 100%;
        }

        .search-header {
          padding-bottom: 0px;
          border-bottom: none;
          margin-bottom: 12px;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(17, 24, 39, 0.6);
          border: 1px solid var(--card-border);
          border-radius: 8px;
          padding: 10px 16px;
          width: 100%;
        }

        .search-box input {
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-main);
          width: 100%;
          font-family: inherit;
        }

        .category-tabs {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          margin-bottom: 20px;
          padding-bottom: 8px;
        }

        .category-tab {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: var(--text-muted);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }
        .category-tab:hover {
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-highlight);
        }
        .category-tab.active {
          background: var(--accent-primary);
          color: white;
          border-color: var(--accent-primary);
        }

        .menu-grid {
          flex-grow: 1;
          overflow-y: auto;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 16px;
          padding-right: 4px;
        }

        .menu-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 16px;
          cursor: pointer;
          height: 140px;
        }

        .menu-card-category {
          font-size: 0.65rem;
          font-weight: 700;
          color: var(--accent-primary);
          text-transform: uppercase;
        }

        .menu-card-title {
          font-size: 0.95rem;
          font-weight: 700;
          margin-top: 4px;
          color: var(--text-highlight);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .menu-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
        }

        .menu-card-price {
          font-weight: 800;
          color: var(--accent-success);
          font-size: 0.95rem;
        }

        .btn-add-item {
          background: var(--accent-primary-glow);
          border: 1px solid rgba(59, 130, 246, 0.2);
          color: var(--accent-primary);
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .menu-card:hover .btn-add-item {
          background: var(--accent-primary);
          color: white;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .payment-modal {
          width: 440px;
          max-width: 90%;
          border: 1px solid var(--card-border);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          overflow: hidden;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--card-border);
        }

        .modal-title-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .modal-title-group h3 {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-highlight);
        }

        .btn-close {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .btn-close:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-highlight);
        }

        .modal-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .payment-summary {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .total-highlight {
          border-top: 1px dashed rgba(255, 255, 255, 0.1);
          padding-top: 12px;
          margin-top: 4px;
          align-items: center;
        }

        .text-2xl {
          font-size: 1.5rem;
        }

        .font-black {
          font-weight: 900;
        }

        .payment-methods-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .payment-method-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
          gap: 10px;
          cursor: pointer;
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 12px;
        }

        .payment-method-card:hover {
          border-color: rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.03);
          transform: translateY(-2px);
        }

        .payment-method-card.selected {
          border-color: var(--accent-primary);
          background: rgba(59, 130, 246, 0.08);
          box-shadow: 0 0 12px rgba(59, 130, 246, 0.15);
        }

        .payment-method-card.selected .payment-icon {
          transform: scale(1.1);
        }

        .payment-icon {
          transition: transform 0.2s ease;
        }

        .payment-label {
          font-weight: 700;
          font-size: 0.9rem;
          color: var(--text-highlight);
        }

        .cash-details {
          display: flex;
          flex-direction: column;
          gap: 12px;
          border-top: 1px solid var(--card-border);
          padding-top: 16px;
        }

        .cash-input {
          font-size: 1.15rem;
          font-weight: 700;
          text-align: center;
          letter-spacing: 0.5px;
        }

        .change-display {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: rgba(16, 185, 129, 0.05);
          border: 1px solid rgba(16, 185, 129, 0.1);
          border-radius: 8px;
        }

        .change-label {
          font-size: 0.85rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .change-val {
          font-size: 1.25rem;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 20px;
          border-top: 1px solid var(--card-border);
          background: rgba(0, 0, 0, 0.15);
        }

        .animate-scale-in {
          animation: scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.92);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .client-modal {
          width: 550px;
          max-width: 95%;
          border: 1px solid var(--card-border);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          overflow: hidden;
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
      `}</style>
      
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="payment-modal glass-panel animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <Calculator size={20} className="text-primary" />
                <h3>Detalle del Pago</h3>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowPaymentModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {/* Order Summary */}
              <div className="payment-summary">
                <div className="summary-row">
                  <span>Mesa:</span>
                  <span className="text-white">
                    {selectedMesa
                      ? `Mesa ${mesas.find((m) => m.mesaId.toString() === selectedMesa)?.numeroMesa}`
                      : "Para Llevar"}
                  </span>
                </div>
                <div className="summary-row">
                  <span>Cliente:</span>
                  <span className="text-white">
                    {selectedCliente
                      ? clientes.find((c) => c.clienteId.toString() === selectedCliente)?.nombre
                      : "Consumidor Final"}
                  </span>
                </div>
                <div className="summary-row total-highlight">
                  <span>Total a Cobrar:</span>
                  <span className="text-success text-2xl font-black">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="payment-methods-grid">
                <div
                  className={`payment-method-card glass-card ${
                    paymentMethod === "efectivo" ? "selected" : ""
                  }`}
                  onClick={() => setPaymentMethod("efectivo")}
                >
                  <Banknote size={28} className="payment-icon text-success" />
                  <span className="payment-label">Efectivo</span>
                </div>
                <div
                  className={`payment-method-card glass-card ${
                    paymentMethod === "tarjeta" ? "selected" : ""
                  }`}
                  onClick={() => setPaymentMethod("tarjeta")}
                >
                  <CreditCard size={28} className="payment-icon text-primary" />
                  <span className="payment-label">Tarjeta</span>
                </div>
              </div>

              {/* Cash specific details */}
              {paymentMethod === "efectivo" && (
                <div className="cash-details animate-fade-in">
                  <div className="form-group">
                    <label className="form-label">Monto Recibido ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="input-field cash-input"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      autoFocus
                    />
                  </div>
                  {parseFloat(cashReceived) > 0 && (
                    <div className="change-display">
                      <span className="change-label">Vuelto:</span>
                      <span
                        className={`change-val ${
                          parseFloat(cashReceived) >= total
                            ? "text-success font-black"
                            : "text-danger"
                        }`}
                      >
                        {parseFloat(cashReceived) >= total
                          ? `$${(parseFloat(cashReceived) - total).toFixed(2)}`
                          : "Monto insuficiente"}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowPaymentModal(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleFinalizePayment}
                disabled={
                  paymentMethod === "efectivo" &&
                  (!cashReceived || parseFloat(cashReceived) < total)
                }
              >
                Confirmar Pago
              </button>
            </div>
          </div>
        </div>
      )}

      {showClientModal && (
        <div className="modal-overlay" onClick={() => setShowClientModal(false)}>
          <div className="client-modal glass-panel animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <User size={20} className="text-primary" />
                <h3>Registrar Nuevo Cliente</h3>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowClientModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleClientSubmit}>
              <div className="modal-body">
                {clientError && <div className="error-banner">{clientError}</div>}

                <div className="form-grid">
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Nombre Completo</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Ej. María Rojas"
                        value={clientNombre}
                        onChange={(e) => setClientNombre(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Correo Electrónico</label>
                      <input
                        type="email"
                        className="input-field"
                        placeholder="Ej. maria@correo.com"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Segmentación</label>
                      <select
                        className="input-field select-field"
                        value={clientSegmento}
                        onChange={(e) => setClientSegmento(e.target.value)}
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
                        value={clientMetodoPago}
                        onChange={(e) => setClientMetodoPago(e.target.value)}
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
                      value={clientPreferencias}
                      onChange={(e) => setClientPreferencias(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowClientModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
