// ========== NUEVA DEFINICIÓN DE API_BASE ==========
const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://restaurantelospatos.onrender.com/api";

export { API_BASE };
// ==================================================

// ========== INTERFACES ==========
export interface Usuario {
  usuarioId: number;
  nombre: string;
  username: string;
  email: string;
  rolSistema: string;
  ultimoLogin?: string;
  estadoActivo: boolean;
}

export interface Cliente {
  clienteId: number;
  nombre: string;
  email: string;
  segmento: string;
  preferencias?: string;
  metodoPagoHabitual: string;
}

export interface Proveedor {
  proveedorId: number;
  nombre: string;
  tipoInsumo?: string;
  frecuenciaEntrega?: string;
  fiabilidadPuntuacion?: number;
  condicionesPago?: string;
}

export interface Producto {
  productoId: number;
  nombre: string;
  categoria: string;
  subcategoria: string;
  precioVenta: number;
  costoProduccion?: number;
  tiempoPreparacionEst?: string;
  proveedor?: Proveedor;
}

export interface Mesa {
  mesaId: number;
  numeroMesa: number;
  ubicacion: string;
  capacidad: number;
  estadoActual: string;
}

export interface VentaDetalle {
  detalleId: number;
  producto?: Producto;
  cantidad: number;
  precioUnitarioMomento: number;
  tiempoPreparacionReal?: string;
  estadoCocina: string;
}

export interface VentaEncabezado {
  ventaId: number;
  fechaHora: string;
  cliente?: Cliente;
  empleado?: any;
  mesa?: Mesa;
  subtotal: number;
  impuestos: number;
  propina: number;
  descuentoAplicado: number;
  totalFinal: number;
  metodoPago?: string;
  detalles: VentaDetalle[];
}

export interface HistorialRow {
  venta_id: number;
  fecha_hora: string;
  cliente: string;
  mesero: string;
  mesa: string;
  producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal_detalle: number;
  tiempo_preparacion: string;
  estado_cocina: string;
  subtotal_venta: number;
  impuestos: number;
  propina: number;
  descuento: number;
  total_final: number;
  metodo_pago?: string;
}

export interface KpisResponse {
  total_ingresos: number;
  total_platos: number;
  ventas_por_categoria: { categoria: string; total: number }[];
  ventas_por_empleado: { empleado: string; total: number }[];
  ventas_por_producto: { producto: string; total: number }[];
  ventas_por_mes: { mes: string; total: number }[];
  ventas_por_dia?: { dia: number; total: number }[];
  ventas_por_anio?: { anio: number; total: number }[];
  ventas_por_cliente?: { cliente: string; total: number }[];
}

// ========== FUNCIÓN REQUEST ==========
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    ...(options?.headers || {}),
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Ha ocurrido un error en el servidor");
  }

  return response.json() as Promise<T>;
}

// ========== OBJETO API ==========
export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<Usuario>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }),
    register: (nombre: string, username: string, email: string, password: string) =>
      request<Usuario>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ nombre, username, email, password }),
      }),
  },

  clientes: {
    getAll: (search?: string) =>
      request<Cliente[]>(`/clientes/${search ? `?search=${encodeURIComponent(search)}` : ""}`),
    create: (data: Partial<Cliente>) =>
      request<Cliente>("/clientes/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<Cliente>) =>
      request<Cliente>(`/clientes/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<{ message: string }>(`/clientes/${id}`, {
        method: "DELETE",
      }),
  },

  productos: {
    getAll: () => request<Producto[]>("/catalogo/productos/"),
    get: (id: number) => request<Producto>(`/catalogo/productos/${id}`),
    create: (data: any) =>
      request<Producto>("/catalogo/productos/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: any) =>
      request<Producto>(`/catalogo/productos/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<{ message: string }>(`/catalogo/productos/${id}`, {
        method: "DELETE",
      }),
  },

  proveedores: {
    getAll: () => request<Proveedor[]>("/catalogo/proveedores/"),
    create: (data: Partial<Proveedor>) =>
      request<Proveedor>("/catalogo/proveedores/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  mesas: {
    getAll: () => request<Mesa[]>("/mesas/"),
    create: (data: Partial<Mesa>) =>
      request<Mesa>("/mesas/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<Mesa>) =>
      request<Mesa>(`/mesas/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<{ message: string }>(`/mesas/${id}`, {
        method: "DELETE",
      }),
  },

  ventas: {
    getAll: () => request<VentaEncabezado[]>("/ventas/"),
    create: (data: any) =>
      request<VentaEncabezado>("/ventas/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getHistorial: () => request<HistorialRow[]>("/ventas/historial"),
    delete: (id: number) =>
      request<{ message: string }>(`/ventas/${id}`, {
        method: "DELETE",
      }),
    updateCocina: (detalleId: number, estado: string) =>
      request<{ message: string; estado_cocina: string }>(`/ventas/detalle/${detalleId}/cocina`, {
        method: "PUT",
        body: JSON.stringify({ estado_cocina: estado }),
      }),
  },

  analitica: {
    sync: () => request<{ status: string; message: string }>("/analitica/sync", { method: "POST" }),
    getFiltros: () => request<{ years: number[]; months: string[] }>("/analitica/filtros"),
    getKpis: (year?: number, month?: string) => {
      let params = [];
      if (year) params.push(`year=${year}`);
      if (month) params.push(`month=${encodeURIComponent(month)}`);
      const query = params.length ? `?${params.join("&")}` : "";
      return request<KpisResponse>(`/analitica/kpis${query}`);
    },
  },
};