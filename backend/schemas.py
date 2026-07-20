from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime, date, time

def to_camel(string: str) -> str:
    components = string.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])

class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )

# --- AUTHENTICATION SCHEMAS ---

class UsuarioLogin(CamelModel):
    username: str
    password: str

class UsuarioRegister(CamelModel):
    nombre: Optional[str] = None
    username: str
    email: str
    password: str

class UsuarioOut(CamelModel):
    usuario_id: int
    nombre: Optional[str]
    username: str
    email: str
    rol_sistema: str
    ultimo_login: Optional[datetime] = None
    estado_activo: bool


# --- OPERATIONAL SCHEMAS ---

class EmpleadoOut(CamelModel):
    empleado_id: int
    nombre: str
    email: Optional[str]
    rol: Optional[str]
    turno: Optional[str]
    estado_activo: bool


class ClienteCreate(CamelModel):
    nombre: Optional[str] = None
    email: Optional[str] = None
    segmento: Optional[str] = None
    preferencias: Optional[str] = None
    metodo_pago_habitual: Optional[str] = None

class ClienteOut(CamelModel):
    cliente_id: int
    nombre: Optional[str]
    email: Optional[str]
    segmento: Optional[str]
    preferencias: Optional[str]
    metodo_pago_habitual: Optional[str]


class ProveedorCreate(CamelModel):
    nombre: str
    tipo_insumo: Optional[str] = None
    frecuencia_entrega: Optional[str] = None
    fiabilidad_puntuacion: Optional[int] = None
    condiciones_pago: Optional[str] = None

class ProveedorOut(CamelModel):
    proveedor_id: int
    nombre: str
    tipo_insumo: Optional[str]
    frecuencia_entrega: Optional[str]
    fiabilidad_puntuacion: Optional[int]
    condiciones_pago: Optional[str]


class ProductoCreate(CamelModel):
    nombre: str
    categoria: Optional[str] = None
    subcategoria: Optional[str] = None
    precio_venta: float
    costo_produccion: Optional[float] = None
    tiempo_preparacion_est: Optional[str] = None
    proveedor_id: Optional[int] = None

class ProductoOut(CamelModel):
    producto_id: int
    nombre: str
    categoria: Optional[str]
    subcategoria: Optional[str]
    precio_venta: float
    costo_produccion: Optional[float]
    tiempo_preparacion_est: Optional[str]
    proveedor: Optional[ProveedorOut] = None


class MesaCreate(CamelModel):
    numero_mesa: int
    ubicacion: Optional[str] = None
    capacidad: Optional[int] = None
    estado_actual: Optional[str] = "libre"

class MesaOut(CamelModel):
    mesa_id: int
    numero_mesa: int
    ubicacion: Optional[str]
    capacidad: Optional[int]
    estado_actual: str


# --- SALES SCHEMAS ---

class VentaDetalleCreate(CamelModel):
    producto_id: int
    cantidad: int
    precio_unitario_momento: Optional[float] = None
    tiempo_preparacion_real: Optional[str] = None
    estado_cocina: Optional[str] = "pendiente"

class VentaCreate(CamelModel):
    cliente_id: Optional[int] = None
    empleado_id: Optional[int] = None
    mesa_id: Optional[int] = None
    subtotal: Optional[float] = None
    impuestos: Optional[float] = None
    propina: Optional[float] = None
    descuento_aplicado: Optional[float] = None
    total_final: Optional[float] = None
    metodo_pago: Optional[str] = None
    detalles: List[VentaDetalleCreate] = []

class VentaDetalleOut(CamelModel):
    detalle_id: int
    producto: Optional[ProductoOut] = None
    cantidad: int
    precio_unitario_momento: Optional[float]
    tiempo_preparacion_real: Optional[str]
    estado_cocina: str

class VentaEncabezadoOut(CamelModel):
    venta_id: int
    fecha_hora: datetime
    cliente: Optional[ClienteOut] = None
    empleado: Optional[EmpleadoOut] = None
    mesa: Optional[MesaOut] = None
    subtotal: Optional[float]
    impuestos: Optional[float]
    propina: Optional[float]
    descuento_aplicado: Optional[float]
    total_final: Optional[float]
    metodo_pago: Optional[str] = None
    detalles: List[VentaDetalleOut] = []


class DetalleCocinaUpdate(BaseModel):
    # Keep flat name because frontend explicitly sets { estado_cocina: string }
    estado_cocina: str
