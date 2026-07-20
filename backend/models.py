from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Time, Numeric, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    usuario_id = Column(Integer, primary_key=True, index=True)
    empleado_id = Column(Integer, ForeignKey("empleados.empleado_id"), unique=True, nullable=True)
    nombre = Column(String(50), nullable=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    rol_sistema = Column(String(20), nullable=False, default="empleado")
    ultimo_login = Column(DateTime, nullable=True)
    estado_activo = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime, default=func.now())

    empleado = relationship("Empleado")


class Empleado(Base):
    __tablename__ = "empleados"

    empleado_id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=True)
    password_hash = Column(String(200), nullable=True)
    rol = Column(String(30), nullable=True)
    turno = Column(String(20), nullable=True)
    fecha_contratacion = Column(DateTime, default=func.now())
    estado_activo = Column(Boolean, default=True)


class Cliente(Base):
    __tablename__ = "clientes"

    cliente_id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=True)
    email = Column(String(100), unique=True, nullable=True)
    segmento = Column(String(30), nullable=True)
    preferencias = Column(Text, nullable=True)
    metodo_pago_habitual = Column(String(30), nullable=True)


class Proveedor(Base):
    __tablename__ = "proveedores"

    proveedor_id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    tipo_insumo = Column(String(50), nullable=True)
    frecuencia_entrega = Column(String(30), nullable=True)
    fiabilidad_puntuacion = Column(Integer, nullable=True)
    condiciones_pago = Column(Text, nullable=True)


class Producto(Base):
    __tablename__ = "productos"

    producto_id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    categoria = Column(String(50), nullable=True)
    subcategoria = Column(String(50), nullable=True)
    precio_venta = Column(Numeric(10, 2), nullable=False)
    costo_produccion = Column(Numeric(10, 2), nullable=True)
    tiempo_preparacion_est = Column(String(50), nullable=True)
    proveedor_id = Column(Integer, ForeignKey("proveedores.proveedor_id"), nullable=True)

    proveedor = relationship("Proveedor")


class Mesa(Base):
    __tablename__ = "mesas"

    mesa_id = Column(Integer, primary_key=True, index=True)
    numero_mesa = Column(Integer, unique=True, nullable=False)
    ubicacion = Column(String(30), nullable=True)
    capacidad = Column(Integer, nullable=True)
    estado_actual = Column(String(20), default="libre")


class VentaEncabezado(Base):
    __tablename__ = "ventas_encabezado"

    venta_id = Column(Integer, primary_key=True, index=True)
    fecha_hora = Column(DateTime, default=func.now(), index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.cliente_id"), nullable=True)
    empleado_id = Column(Integer, ForeignKey("empleados.empleado_id"), nullable=True)
    mesa_id = Column(Integer, ForeignKey("mesas.mesa_id"), nullable=True)
    subtotal = Column(Numeric(12, 2), nullable=True)
    impuestos = Column(Numeric(12, 2), nullable=True)
    propina = Column(Numeric(10, 2), nullable=True)
    descuento_aplicado = Column(Numeric(10, 2), nullable=True)
    total_final = Column(Numeric(12, 2), nullable=True)
    metodo_pago = Column(String(30), nullable=True)

    cliente = relationship("Cliente")
    empleado = relationship("Empleado")
    mesa = relationship("Mesa")
    detalles = relationship("VentaDetalle", back_populates="venta", cascade="all, delete-orphan")


class VentaDetalle(Base):
    __tablename__ = "ventas_detalle"

    detalle_id = Column(Integer, primary_key=True, index=True)
    venta_id = Column(Integer, ForeignKey("ventas_encabezado.venta_id"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.producto_id"), nullable=True)
    cantidad = Column(Integer, nullable=False)
    precio_unitario_momento = Column(Numeric(10, 2), nullable=True)
    tiempo_preparacion_real = Column(String(50), nullable=True)
    estado_cocina = Column(String(20), default="pendiente")

    venta = relationship("VentaEncabezado", back_populates="detalles")
    producto = relationship("Producto")


class MovimientoInventario(Base):
    __tablename__ = "movimientos_inventario"

    movimiento_id = Column(Integer, primary_key=True, index=True)
    producto_id = Column(Integer, ForeignKey("productos.producto_id"), nullable=True)
    tipo_movimiento = Column(String(20), nullable=True)
    cantidad = Column(Numeric(10, 2), nullable=False)
    fecha_movimiento = Column(DateTime, default=func.now())
    proveedor_id = Column(Integer, ForeignKey("proveedores.proveedor_id"), nullable=True)
    costo_unitario_lote = Column(Numeric(10, 2), nullable=True)

    producto = relationship("Producto")
    proveedor = relationship("Proveedor")


class Reserva(Base):
    __tablename__ = "reservas"

    reserva_id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.cliente_id"), nullable=True)
    mesa_id = Column(Integer, ForeignKey("mesas.mesa_id"), nullable=True)
    empleado_id = Column(Integer, ForeignKey("empleados.empleado_id"), nullable=True)
    fecha_reserva = Column(Date, nullable=False)
    hora_reserva = Column(Time, nullable=False)
    num_comensales = Column(Integer, nullable=False)
    estado_reserva = Column(String(20), default="confirmada")
    tiempo_ocupacion_real = Column(String(50), nullable=True)
    ingreso_estimado = Column(Numeric(10, 2), nullable=True)

    cliente = relationship("Cliente")
    mesa = relationship("Mesa")
    empleado = relationship("Empleado")


# --- MODELOS DEL DATA WAREHOUSE (ANALÍTICA) ---

class DimCliente(Base):
    __tablename__ = "dim_cliente"

    cliente_id = Column(Integer, primary_key=True)
    nombre = Column(String(100), nullable=True)
    email = Column(String(100), nullable=True)
    segmento = Column(String(30), nullable=True)
    preferencias = Column(Text, nullable=True)
    metodo_pago_preferido = Column(String(30), nullable=True)


class DimEmpleado(Base):
    __tablename__ = "dim_empleado"

    empleado_id = Column(Integer, primary_key=True)
    nombre = Column(String(100), nullable=True)
    email = Column(String(100), nullable=True)
    rol = Column(String(30), nullable=True)
    turno = Column(String(20), nullable=True)
    estado_activo = Column(Boolean, default=True)


class DimMesa(Base):
    __tablename__ = "dim_mesa"

    mesa_id = Column(Integer, primary_key=True)
    numero_mesa = Column(Integer, nullable=False)
    ubicacion = Column(String(30), nullable=True)
    capacidad = Column(Integer, nullable=True)
    estado_actual = Column(String(20), nullable=True)


class DimProducto(Base):
    __tablename__ = "dim_producto"

    producto_id = Column(Integer, primary_key=True)
    nombre = Column(String(100), nullable=False)
    categoria = Column(String(50), nullable=True)
    subcategoria = Column(String(50), nullable=True)
    precio_actual = Column(Numeric(10, 2), nullable=True)
    costo_actual = Column(Numeric(10, 2), nullable=True)
    margen_teorico = Column(Numeric(10, 2), nullable=True)
    tiempo_preparacion_est = Column(String(50), nullable=True)
    proveedor_principal_id = Column(Integer, nullable=True)


class DimProveedor(Base):
    __tablename__ = "dim_proveedor"

    proveedor_id = Column(Integer, primary_key=True)
    nombre = Column(String(100), nullable=False)
    tipo_insumo = Column(String(50), nullable=True)
    frecuencia_entrega = Column(String(30), nullable=True)
    fiabilidad_puntuacion = Column(Integer, nullable=True)
    condiciones_pago = Column(Text, nullable=True)


class DimTiempo(Base):
    __tablename__ = "dim_tiempo"

    tiempo_id = Column(Integer, primary_key=True)
    fecha = Column(Date, nullable=False, index=True)
    mes = Column(String(20), nullable=False)
    dia_semana = Column(String(20), nullable=False)


class FactVenta(Base):
    __tablename__ = "fact_ventas"

    venta_sk = Column(Integer, primary_key=True, autoincrement=True)
    tiempo_id = Column(Integer, ForeignKey("dim_tiempo.tiempo_id"), nullable=True)
    producto_id = Column(Integer, ForeignKey("dim_producto.producto_id"), nullable=True)
    cliente_id = Column(Integer, ForeignKey("dim_cliente.cliente_id"), nullable=True)
    empleado_id = Column(Integer, ForeignKey("dim_empleado.empleado_id"), nullable=True)
    mesa_id = Column(Integer, ForeignKey("dim_mesa.mesa_id"), nullable=True)
    cantidad_vendida = Column(Integer, nullable=True)
    monto_total_linea = Column(Numeric(12, 2), nullable=True)
    descuento_aplicado = Column(Numeric(10, 2), nullable=True)
    propina_proporcional = Column(Numeric(10, 2), nullable=True)
    tiempo_preparacion_real = Column(String(50), nullable=True)
    estado_cocina_final = Column(String(20), nullable=True)

    tiempo = relationship("DimTiempo")
    producto = relationship("DimProducto")
    cliente = relationship("DimCliente")
    empleado = relationship("DimEmpleado")
    mesa = relationship("DimMesa")


class FactInventario(Base):
    __tablename__ = "fact_inventario"

    inventario_sk = Column(Integer, primary_key=True, autoincrement=True)
    tiempo_id = Column(Integer, ForeignKey("dim_tiempo.tiempo_id"), nullable=True)
    producto_id = Column(Integer, ForeignKey("dim_producto.producto_id"), nullable=True)
    proveedor_id = Column(Integer, ForeignKey("dim_proveedor.proveedor_id"), nullable=True)
    cantidad_ingresada = Column(Numeric(10, 2), nullable=True)
    cantidad_consumida = Column(Numeric(10, 2), nullable=True)
    mermas = Column(Numeric(10, 2), nullable=True)
    stock_final_periodo = Column(Numeric(10, 2), nullable=True)
    valor_monetario_stock = Column(Numeric(12, 2), nullable=True)
    dias_inventario = Column(Integer, nullable=True)

    tiempo = relationship("DimTiempo")
    producto = relationship("DimProducto")
    proveedor = relationship("DimProveedor")


class FactReserva(Base):
    __tablename__ = "fact_reservas"

    reserva_sk = Column(Integer, primary_key=True, autoincrement=True)
    tiempo_id = Column(Integer, ForeignKey("dim_tiempo.tiempo_id"), nullable=True)
    cliente_id = Column(Integer, ForeignKey("dim_cliente.cliente_id"), nullable=True)
    mesa_id = Column(Integer, ForeignKey("dim_mesa.mesa_id"), nullable=True)
    empleado_id = Column(Integer, ForeignKey("dim_empleado.empleado_id"), nullable=True)
    num_comensales = Column(Integer, nullable=True)
    tiempo_ocupacion_real = Column(String(50), nullable=True)
    es_cancelacion = Column(Boolean, default=False)
    es_no_show = Column(Boolean, default=False)
    ingreso_estimado = Column(Numeric(12, 2), nullable=True)

    tiempo = relationship("DimTiempo")
    cliente = relationship("DimCliente")
    mesa = relationship("DimMesa")
    empleado = relationship("DimEmpleado")
