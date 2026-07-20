import os
import sys

# Add parent directory of 'backend' to sys.path so we can run uvicorn from inside backend/
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import httpx
from datetime import datetime, date
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, Query, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func

from backend.database import engine, Base, get_db
from backend.models import (
    Usuario, Empleado, Cliente, Proveedor, Producto, Mesa,
    VentaEncabezado, VentaDetalle, MovimientoInventario, Reserva,
    DimCliente, DimEmpleado, DimMesa, DimProducto, DimProveedor, DimTiempo, FactVenta,
    FactInventario, FactReserva
)
from backend.schemas import (
    UsuarioOut, ClienteCreate, ClienteOut, ProveedorCreate, ProveedorOut,
    ProductoCreate, ProductoOut, MesaCreate, MesaOut,
    VentaCreate, VentaEncabezadoOut, DetalleCocinaUpdate, MesaOut
)
from backend.auth import router as auth_router
from backend.email_service import send_sale_email
from backend.predicts_pipeline import (
    load_or_generate_data, preprocess_data, run_eda, train_models,
    run_cross_validation, run_hyperparameter_tuning, run_statistical_tests,
    run_demand_forecast, generate_pdf_report, generate_word_report, generate_excel_report
)

# Initialize DB Tables at startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Restaurante Los Patos - API", version="1.0.0")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local development ease, Vercel deployments can communicate
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Auth Router under '/api'
app.include_router(auth_router, prefix="/api")

# Static files for predictive chart assets
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(STATIC_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


# --- CLIENTES CRUD ---

@app.get("/api/clientes/", response_model=List[ClienteOut])
def get_clientes(search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Cliente)
    if search:
        query = query.filter(
            or_(
                Cliente.nombre.ilike(f"%{search}%"),
                Cliente.email.ilike(f"%{search}%")
            )
        )
    return query.all()

@app.post("/api/clientes/", response_model=ClienteOut)
def create_cliente(dto: ClienteCreate, db: Session = Depends(get_db)):
    cliente = Cliente(
        nombre=dto.nombre,
        email=dto.email,
        segmento=dto.segmento,
        preferencias=dto.preferencias,
        metodo_pago_habitual=dto.metodo_pago_habitual
    )
    db.add(cliente)
    db.commit()
    db.refresh(cliente)
    return cliente

@app.put("/api/clientes/{id}", response_model=ClienteOut)
def update_cliente(id: int, dto: ClienteCreate, db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(Cliente.cliente_id == id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    cliente.nombre = dto.nombre
    cliente.email = dto.email
    cliente.segmento = dto.segmento
    cliente.preferencias = dto.preferencias
    cliente.metodo_pago_habitual = dto.metodo_pago_habitual
    
    db.commit()
    db.refresh(cliente)
    return cliente

@app.delete("/api/clientes/{id}")
def delete_cliente(id: int, db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(Cliente.cliente_id == id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    db.delete(cliente)
    db.commit()
    return {"message": "Cliente eliminado con éxito"}


# --- PROVEEDORES CRUD ---

@app.get("/api/catalogo/proveedores/", response_model=List[ProveedorOut])
def get_proveedores(db: Session = Depends(get_db)):
    return db.query(Proveedor).all()

@app.post("/api/catalogo/proveedores/", response_model=ProveedorOut)
def create_proveedor(dto: ProveedorCreate, db: Session = Depends(get_db)):
    proveedor = Proveedor(
        nombre=dto.nombre,
        tipo_insumo=dto.tipo_insumo,
        frecuencia_entrega=dto.frecuencia_entrega,
        fiabilidad_puntuacion=dto.fiabilidad_puntuacion,
        condiciones_pago=dto.condiciones_pago
    )
    db.add(proveedor)
    db.commit()
    db.refresh(proveedor)
    return proveedor


# --- PRODUCTOS CRUD ---

@app.get("/api/catalogo/productos/", response_model=List[ProductoOut])
def get_productos(db: Session = Depends(get_db)):
    return db.query(Producto).all()

@app.get("/api/catalogo/productos/{id}", response_model=ProductoOut)
def get_producto(id: int, db: Session = Depends(get_db)):
    p = db.query(Producto).filter(Producto.producto_id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return p

@app.post("/api/catalogo/productos/", response_model=ProductoOut)
def create_producto(dto: ProductoCreate, db: Session = Depends(get_db)):
    p = Producto(
        nombre=dto.nombre,
        categoria=dto.categoria,
        subcategoria=dto.subcategoria,
        precio_venta=dto.precio_venta,
        costo_produccion=dto.costo_produccion,
        tiempo_preparacion_est=dto.tiempo_preparacion_est,
        proveedor_id=dto.proveedor_id
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p

@app.put("/api/catalogo/productos/{id}", response_model=ProductoOut)
def update_producto(id: int, dto: ProductoCreate, db: Session = Depends(get_db)):
    p = db.query(Producto).filter(Producto.producto_id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    p.nombre = dto.nombre
    p.categoria = dto.categoria
    p.subcategoria = dto.subcategoria
    p.precio_venta = dto.precio_venta
    p.costo_produccion = dto.costo_produccion
    p.tiempo_preparacion_est = dto.tiempo_preparacion_est
    p.proveedor_id = dto.proveedor_id
    
    db.commit()
    db.refresh(p)
    return p

@app.delete("/api/catalogo/productos/{id}")
def delete_producto(id: int, db: Session = Depends(get_db)):
    p = db.query(Producto).filter(Producto.producto_id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    db.delete(p)
    db.commit()
    return {"message": "Producto eliminado con éxito"}


# --- MESAS CRUD ---

@app.get("/api/mesas/", response_model=List[MesaOut])
def get_mesas(db: Session = Depends(get_db)):
    return db.query(Mesa).order_by(Mesa.numero_mesa).all()

@app.post("/api/mesas/", response_model=MesaOut)
def create_mesa(dto: MesaCreate, db: Session = Depends(get_db)):
    mesa = Mesa(
        numero_mesa=dto.numero_mesa,
        ubicacion=dto.ubicacion,
        capacidad=dto.capacidad,
        estado_actual=dto.estado_actual
    )
    db.add(mesa)
    db.commit()
    db.refresh(mesa)
    return mesa

@app.put("/api/mesas/{id}", response_model=MesaOut)
def update_mesa(id: int, dto: MesaCreate, db: Session = Depends(get_db)):
    mesa = db.query(Mesa).filter(Mesa.mesa_id == id).first()
    if not mesa:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")
    
    mesa.numero_mesa = dto.numero_mesa
    mesa.ubicacion = dto.ubicacion
    mesa.capacidad = dto.capacidad
    mesa.estado_actual = dto.estado_actual
    
    db.commit()
    db.refresh(mesa)
    return mesa

@app.delete("/api/mesas/{id}")
def delete_mesa(id: int, db: Session = Depends(get_db)):
    mesa = db.query(Mesa).filter(Mesa.mesa_id == id).first()
    if not mesa:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")
    db.delete(mesa)
    db.commit()
    return {"message": "Mesa eliminada con éxito"}


# --- VENTAS OPERATION ---

@app.get("/api/ventas/", response_model=List[VentaEncabezadoOut])
def get_ventas(db: Session = Depends(get_db)):
    return db.query(VentaEncabezado).order_by(VentaEncabezado.fecha_hora.desc()).all()

@app.post("/api/ventas/", response_model=VentaEncabezadoOut)
def create_venta(dto: VentaCreate, db: Session = Depends(get_db)):
    venta = VentaEncabezado(
        fecha_hora=datetime.now(),
        cliente_id=dto.cliente_id,
        empleado_id=dto.empleado_id,
        mesa_id=dto.mesa_id,
        subtotal=dto.subtotal,
        impuestos=dto.impuestos,
        propina=dto.propina,
        descuento_aplicado=dto.descuento_aplicado,
        total_final=dto.total_final,
        metodo_pago=dto.metodo_pago
    )
    db.add(venta)
    db.commit() # Save parent first to obtain sale_id
    
    details_html_list = []
    
    for det_dto in dto.detalles:
        detalle = VentaDetalle(
            venta_id=venta.venta_id,
            producto_id=det_dto.producto_id,
            cantidad=det_dto.cantidad,
            precio_unitario_momento=det_dto.precio_unitario_momento,
            tiempo_preparacion_real=det_dto.tiempo_preparacion_real,
            estado_cocina=det_dto.estado_cocina
        )
        db.add(detalle)
        
        # Accumulate details html for mail
        prod = db.query(Producto).filter(Producto.producto_id == det_dto.producto_id).first()
        p_name = prod.nombre if prod else "Artículo"
        details_html_list.append(
            f"<tr><td>{p_name}</td><td>x{det_dto.cantidad}</td><td>${float(det_dto.precio_unitario_momento or 0.0):.2f}</td></tr>"
        )
        
    db.commit()
    db.refresh(venta)

    # Change mesa status to ocupada if applicable
    if dto.mesa_id:
        mesa = db.query(Mesa).filter(Mesa.mesa_id == dto.mesa_id).first()
        if mesa:
            mesa.estado_actual = "ocupada"
            db.commit()

    # Trigger async webhook notification (n8n telegram notification)
    # Simulated background post to n8n webhook
    n8n_url = "https://rcginca.app.n8n.cloud/webhook-test/nuevo-pedido"
    try:
        # Fire and forget request to webhook to keep API extremely fast
        # (Using a sync client with timeout to prevent blocking thread)
        with httpx.Client() as client:
            client.post(n8n_url, json={
                "venta_id": venta.venta_id,
                "total": float(venta.total_final or 0.0),
                "num_detalles": len(venta.detalles)
            }, timeout=0.5)
    except Exception:
        pass

    # Send receipt email to the client if they exist and have email
    if venta.cliente and venta.cliente.email:
        details_table = f"<table border='1' cellpadding='5' style='border-collapse: collapse;'>" \
                        f"<thead><tr><th>Artículo</th><th>Cantidad</th><th>Precio</th></tr></thead>" \
                        f"<tbody>{''.join(details_html_list)}</tbody>" \
                        f"</table>"
        try:
            send_sale_email(
                to_email=venta.cliente.email,
                client_name=venta.cliente.nombre or "Cliente",
                total_amount=float(venta.total_final or 0.0),
                details_html=details_table
            )
        except Exception:
            pass

    return venta

@app.get("/api/ventas/historial")
def get_venta_historial(db: Session = Depends(get_db)):
    """
    Returns a flat row representation of sales details for history table.
    """
    results = db.query(
        VentaDetalle.detalle_id,
        VentaEncabezado.venta_id,
        VentaEncabezado.fecha_hora,
        Cliente.nombre.label("cliente"),
        Empleado.nombre.label("mesero"),
        Mesa.numero_mesa.label("mesa"),
        Producto.nombre.label("producto"),
        VentaDetalle.cantidad,
        VentaDetalle.precio_unitario_momento.label("precio_unitario"),
        VentaDetalle.tiempo_preparacion_real.label("tiempo_preparacion"),
        VentaDetalle.estado_cocina,
        VentaEncabezado.subtotal.label("subtotal_venta"),
        VentaEncabezado.impuestos,
        VentaEncabezado.propina,
        VentaEncabezado.descuento_aplicado.label("descuento"),
        VentaEncabezado.total_final,
        VentaEncabezado.metodo_pago
    ).join(VentaEncabezado, VentaDetalle.venta_id == VentaEncabezado.venta_id)\
     .outerjoin(Cliente, VentaEncabezado.cliente_id == Cliente.cliente_id)\
     .outerjoin(Empleado, VentaEncabezado.empleado_id == Empleado.empleado_id)\
     .outerjoin(Mesa, VentaEncabezado.mesa_id == Mesa.mesa_id)\
     .outerjoin(Producto, VentaDetalle.producto_id == Producto.producto_id)\
     .order_by(VentaEncabezado.fecha_hora.desc()).all()
     
    flat_rows = []
    for r in results:
        subtotal_det = float(r.precio_unitario or 0) * r.cantidad
        flat_rows.append({
            "venta_id": r.venta_id,
            "fecha_hora": r.fecha_hora.isoformat() if r.fecha_hora else "",
            "cliente": r.cliente or "Cliente General",
            "mesero": r.mesero or "Desconocido",
            "mesa": f"Mesa {r.mesa}" if r.mesa else "Para Llevar",
            "producto": r.producto or "Artículo",
            "cantidad": r.cantidad,
            "precio_unitario": float(r.precio_unitario or 0),
            "subtotal_detalle": subtotal_det,
            "tiempo_preparacion": r.tiempo_preparacion or "Pendiente",
            "estado_cocina": r.estado_cocina,
            "subtotal_venta": float(r.subtotal_venta or 0),
            "impuestos": float(r.impuestos or 0),
            "propina": float(r.propina or 0),
            "descuento": float(r.descuento or 0),
            "total_final": float(r.total_final or 0),
            "metodo_pago": r.metodo_pago or "No especificado"
        })
    return flat_rows

@app.delete("/api/ventas/{id}")
def delete_venta(id: int, db: Session = Depends(get_db)):
    venta = db.query(VentaEncabezado).filter(VentaEncabezado.venta_id == id).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    db.delete(venta)
    db.commit()
    return {"message": "Venta eliminada con éxito"}

@app.put("/api/ventas/detalle/{detalleId}/cocina")
def update_cocina_status(detalleId: int, dto: DetalleCocinaUpdate, db: Session = Depends(get_db)):
    det = db.query(VentaDetalle).filter(VentaDetalle.detalle_id == detalleId).first()
    if not det:
        raise HTTPException(status_code=404, detail="Detalle no encontrado")
        
    det.estado_cocina = dto.estado_cocina
    db.commit()
    
    # If all items in this sale are completed/delivered, liberate table
    venta = det.venta
    if venta and venta.mesa_id:
        all_completed = True
        for item in venta.detalles:
            if item.estado_cocina not in ["completado", "entregado"]:
                all_completed = False
                break
        if all_completed:
            mesa = db.query(Mesa).filter(Mesa.mesa_id == venta.mesa_id).first()
            if mesa:
                mesa.estado_actual = "libre"
                db.commit()
                
    return {"message": "Estado de cocina actualizado", "estado_cocina": det.estado_cocina}


# --- ANALÍTICA & DATA WAREHOUSE ENDPOINTS ---

@app.post("/api/analitica/sync")
def sync_data(db: Session = Depends(get_db)):
    db.query(FactVenta).delete()
    db.query(FactInventario).delete()
    db.query(FactReserva).delete()
    db.query(DimTiempo).delete()
    db.query(DimProducto).delete()
    db.query(DimCliente).delete()
    db.query(DimEmpleado).delete()
    db.query(DimMesa).delete()
    db.query(DimProveedor).delete()
    db.commit()

    # Fill Dimensions
    for p in db.query(Producto).all():
        db.add(DimProducto(
            producto_id=p.producto_id,
            nombre=p.nombre,
            categoria=p.categoria,
            subcategoria=p.subcategoria,
            precio_actual=p.precio_venta,
            costo_actual=p.costo_produccion,
            margen_teorico=(p.precio_venta - p.costo_produccion) if (p.precio_venta and p.costo_produccion) else 0.0,
            tiempo_preparacion_est=p.tiempo_preparacion_est,
            proveedor_principal_id=p.proveedor_id
        ))
        
    for c in db.query(Cliente).all():
        db.add(DimCliente(
            cliente_id=c.cliente_id,
            nombre=c.nombre,
            email=c.email,
            segmento=c.segmento,
            preferencias=c.preferencias,
            metodo_pago_preferido=c.metodo_pago_habitual
        ))
        
    for e in db.query(Empleado).all():
        db.add(DimEmpleado(
            empleado_id=e.empleado_id,
            nombre=e.nombre,
            email=e.email,
            rol=e.rol,
            turno=e.turno,
            estado_activo=e.estado_activo
        ))
        
    for m in db.query(Mesa).all():
        db.add(DimMesa(
            mesa_id=m.mesa_id,
            numero_mesa=m.numero_mesa,
            ubicacion=m.ubicacion,
            capacidad=m.capacidad,
            estado_actual=m.estado_actual
        ))
        
    for prov in db.query(Proveedor).all():
        db.add(DimProveedor(
            proveedor_id=prov.proveedor_id,
            nombre=prov.nombre,
            tipo_insumo=prov.tipo_insumo,
            frecuencia_entrega=prov.frecuencia_entrega,
            fiabilidad_puntuacion=prov.fiabilidad_puntuacion,
            condiciones_pago=prov.condiciones_pago
        ))
    db.commit()
    
    # Fill Time Dimension & Sales Facts
    ventas = db.query(VentaEncabezado).all()
    fecha_to_dim = {}
    t_id = 1
    
    meses_es = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
    dias_es = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]
    
    for v in ventas:
        if not v.fecha_hora:
            continue
        fecha = v.fecha_hora.date()
        if fecha not in fecha_to_dim:
            dt = DimTiempo(
                tiempo_id=t_id,
                fecha=fecha,
                mes=meses_es[fecha.month - 1],
                dia_semana=dias_es[fecha.weekday()]
            )
            db.add(dt)
            fecha_to_dim[fecha] = t_id
            t_id += 1
    db.commit()
    
    for v in ventas:
        if not v.fecha_hora:
            continue
        tiempo_id = fecha_to_dim.get(v.fecha_hora.date())
        num_items = len(v.detalles)
        propina_p = (float(v.propina or 0.0) / num_items) if num_items > 0 else 0.0
        desc_p = (float(v.descuento_aplicado or 0.0) / num_items) if num_items > 0 else 0.0
        
        if num_items == 0:
            db.add(FactVenta(
                tiempo_id=tiempo_id,
                cliente_id=v.cliente_id,
                empleado_id=v.empleado_id,
                mesa_id=v.mesa_id,
                cantidad_vendida=1,
                monto_total_linea=v.subtotal or v.total_final or 0.0,
                descuento_aplicado=v.descuento_aplicado or 0.0,
                propina_proporcional=v.propina or 0.0,
                estado_cocina_final="completado"
            ))
        else:
            for d in v.detalles:
                line_total = float(d.precio_unitario_momento or 0.0) * d.cantidad
                db.add(FactVenta(
                    tiempo_id=tiempo_id,
                    producto_id=d.producto_id,
                    cliente_id=v.cliente_id,
                    empleado_id=v.empleado_id,
                    mesa_id=v.mesa_id,
                    cantidad_vendida=d.cantidad,
                    monto_total_linea=line_total,
                    descuento_aplicado=desc_p,
                    propina_proporcional=propina_p,
                    tiempo_preparacion_real=d.tiempo_preparacion_real,
                    estado_cocina_final=d.estado_cocina
                ))
    db.commit()
    return {"status": "success", "message": "ETL completado. Data Warehouse sincronizado."}

@app.get("/api/analitica/filtros")
def get_analitica_filtros(db: Session = Depends(get_db)):
    """
    Returns unique years and months from the sales history.
    """
    # Fetch dates from DimTiempo
    fechas = db.query(DimTiempo.fecha).distinct().all()
    years = sorted(list(set([f[0].year for f in fechas if f[0]])))
    
    # Month list sorted in natural order
    meses_orden = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
    meses_db = db.query(DimTiempo.mes).distinct().all()
    months_in_db = set([m[0] for m in meses_db if m[0]])
    months = [m.capitalize() for m in meses_orden if m in months_in_db]
    
    return {"years": years, "months": months}

@app.get("/api/analitica/kpis")
def get_analitica_kpis(
    year: Optional[int] = None,
    month: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Aggregates metrics for the analytical dashboard with filters.
    """
    query = db.query(FactVenta).join(DimTiempo, FactVenta.tiempo_id == DimTiempo.tiempo_id)
    if year:
        query = query.filter(func.extract('year', DimTiempo.fecha) == year)
    if month:
        query = query.filter(DimTiempo.mes == month.lower())
        
    sales = query.all()
    
    total_ingresos = 0.0
    total_platos = 0
    
    cat_sales = {}
    emp_sales = {}
    prod_sales = {}
    mes_sales = {}
    cli_sales = {}
    
    for s in sales:
        monto = float(s.monto_total_linea or 0.0)
        total_ingresos += monto
        total_platos += s.cantidad_vendida or 0
        
        # Categorias
        cat = s.producto.categoria if (s.producto and s.producto.categoria) else "Sin Categoría"
        cat_sales[cat] = cat_sales.get(cat, 0.0) + monto
        
        # Empleados
        emp = s.empleado.nombre if (s.empleado and s.empleado.nombre) else "Desconocido"
        emp_sales[emp] = emp_sales.get(emp, 0.0) + monto
        
        # Productos
        prod = s.producto.nombre if (s.producto and s.producto.nombre) else "Desconocido"
        prod_sales[prod] = prod_sales.get(prod, 0.0) + monto
        
        # Clientes
        cli = s.cliente.nombre if (s.cliente and s.cliente.nombre) else "Cliente General"
        cli_sales[cli] = cli_sales.get(cli, 0.0) + monto
        
        # Meses
        m_name = s.tiempo.mes.capitalize() if s.tiempo else "Desconocido"
        mes_sales[m_name] = mes_sales.get(m_name, 0.0) + monto
        
    return {
        "total_ingresos": round(total_ingresos, 2),
        "total_platos": total_platos,
        "ventas_por_categoria": [{"categoria": k, "total": round(v, 2)} for k, v in cat_sales.items()],
        "ventas_por_empleado": [{"empleado": k, "total": round(v, 2)} for k, v in emp_sales.items()],
        "ventas_por_producto": [{"producto": k, "total": round(v, 2)} for k, v in prod_sales.items()],
        "ventas_por_mes": [{"mes": k, "total": round(v, 2)} for k, v in mes_sales.items()],
        "ventas_por_cliente": [{"cliente": k, "total": round(v, 2)} for k, v in cli_sales.items()]
    }


# --- MACHINE LEARNING & PREDICTION PIPELINE ---

@app.post("/api/predicts/train")
def train_prediction_models(db: Session = Depends(get_db)):
    """
    Fases 1 y 2: Ejecuta EDA, entrena 3 clásicos y 2 híbridos,
    genera curvas y graba el mejor modelo.
    """
    df, products = load_or_generate_data(db)
    if df.empty:
        raise HTTPException(status_code=400, detail="No hay suficientes productos cargados para entrenar modelos.")
        
    X, y, df, enc = preprocess_data(df)
    
    # Run training
    train_results, best_name, y_test, preds_test = train_models(X, y, df)
    
    # Extract EDA descriptives
    eda_stats = run_eda(df)
    
    # Save the statistics to return
    return {
        "best_model": best_name,
        "results": train_results,
        "eda": {
            "mean": eda_stats["mean"],
            "std": eda_stats["std"],
            "count": eda_stats["count"],
            "min": eda_stats["min"],
            "max": eda_stats["max"]
        }
    }

@app.get("/api/predicts/eda")
def get_eda_report(db: Session = Depends(get_db)):
    """
    Fase 1: Reporta estadísticos descriptivos detallados.
    """
    df, _ = load_or_generate_data(db)
    if df.empty:
        raise HTTPException(status_code=400, detail="Historial vacío.")
    X, y, df, _ = preprocess_data(df)
    stats = run_eda(df)
    return stats

@app.get("/api/predicts/cross_validation")
def get_cross_validation(folds: int = Query(5, ge=2, le=10), db: Session = Depends(get_db)):
    """
    Fase 3: Validación cruzada de 5 folds configurable.
    """
    df, _ = load_or_generate_data(db)
    if df.empty:
        raise HTTPException(status_code=400, detail="Datos vacíos.")
    X, y, _, _ = preprocess_data(df)
    cv_res = run_cross_validation(X, y, folds=folds)
    return cv_res

@app.post("/api/predicts/tune")
def tune_hyperparameters(db: Session = Depends(get_db)):
    """
    Fase 4: Optimiza los hiperparámetros.
    """
    df, _ = load_or_generate_data(db)
    if df.empty:
        raise HTTPException(status_code=400, detail="Datos vacíos.")
    X, y, _, _ = preprocess_data(df)
    tuning_res = run_hyperparameter_tuning(X, y)
    return tuning_res

@app.get("/api/predicts/statistical_tests")
def get_statistical_tests(db: Session = Depends(get_db)):
    """
    Fase 5: Pruebas estadísticas robustas (Wilcoxon & T-Test).
    """
    df, _ = load_or_generate_data(db)
    if df.empty:
        raise HTTPException(status_code=400, detail="Datos vacíos.")
    X, y, df, _ = preprocess_data(df)
    
    # Train/get predictions on test set
    train_results, best_name, y_test, preds_test = train_models(X, y, df)
    tests = run_statistical_tests(y_test, preds_test, best_name)
    return tests

@app.get("/api/predicts/forecast")
def get_forecast(db: Session = Depends(get_db)):
    """
    Inference: Runs forecast for the next 7 days using the best model.
    """
    return run_demand_forecast(db)


# --- DOWNLOADABLE REPORT ROUTERS ---

@app.get("/api/predicts/reports/pdf")
def get_pdf_report_download(db: Session = Depends(get_db)):
    """
    Fase 6: Genera y descarga el reporte PDF.
    """
    df, _ = load_or_generate_data(db)
    if df.empty:
        raise HTTPException(status_code=400, detail="Datos vacíos.")
    X, y, df, _ = preprocess_data(df)
    
    # Re-train models to get final metrics
    train_results, best_name, y_test, preds_test = train_models(X, y, df)
    eda_stats = run_eda(df)
    stat_tests = run_statistical_tests(y_test, preds_test, best_name)
    forecast_data = run_demand_forecast(db)
    
    pdf_path = os.path.join(STATIC_DIR, "reporte_demanda.pdf")
    generate_pdf_report(eda_stats, train_results, best_name, stat_tests, forecast_data, pdf_path)
    
    return FileResponse(pdf_path, media_type="application/pdf", filename="reporte_analitica_demanda.pdf")

@app.get("/api/predicts/reports/word")
def get_word_report_download(db: Session = Depends(get_db)):
    """
    Fase 6: Genera y descarga el reporte Word (Docx).
    """
    df, _ = load_or_generate_data(db)
    if df.empty:
        raise HTTPException(status_code=400, detail="Datos vacíos.")
    X, y, df, _ = preprocess_data(df)
    
    train_results, best_name, y_test, preds_test = train_models(X, y, df)
    eda_stats = run_eda(df)
    stat_tests = run_statistical_tests(y_test, preds_test, best_name)
    forecast_data = run_demand_forecast(db)
    
    word_path = os.path.join(STATIC_DIR, "reporte_demanda.docx")
    generate_word_report(eda_stats, train_results, best_name, stat_tests, forecast_data, word_path)
    
    return FileResponse(word_path, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", filename="reporte_cientifico_demanda.docx")

@app.get("/api/predicts/reports/excel")
def get_excel_report_download(db: Session = Depends(get_db)):
    """
    Fase 6: Genera y descarga el reporte Excel (Xlsx).
    """
    df, _ = load_or_generate_data(db)
    if df.empty:
        raise HTTPException(status_code=400, detail="Datos vacíos.")
    X, y, df, _ = preprocess_data(df)
    
    train_results, best_name, y_test, preds_test = train_models(X, y, df)
    eda_stats = run_eda(df)
    stat_tests = run_statistical_tests(y_test, preds_test, best_name)
    forecast_data = run_demand_forecast(db)
    
    excel_path = os.path.join(STATIC_DIR, "reporte_demanda.xlsx")
    generate_excel_report(eda_stats, train_results, best_name, stat_tests, forecast_data, excel_path)
    
    return FileResponse(excel_path, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename="hoja_metricas_prediccion.xlsx")


# Add compatible backward router for older reports
@app.get("/api/analitica/reporte_pdf")
def get_report_pdf_backward(
    year: Optional[int] = None,
    month: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Simple report generation from Analytics view. Redirects/generates PDF.
    """
    df, _ = load_or_generate_data(db)
    X, y, df, _ = preprocess_data(df)
    train_results, best_name, y_test, preds_test = train_models(X, y, df)
    eda_stats = run_eda(df)
    stat_tests = run_statistical_tests(y_test, preds_test, best_name)
    forecast_data = run_demand_forecast(db)
    
    pdf_path = os.path.join(STATIC_DIR, "reporte_analitica_dw.pdf")
    generate_pdf_report(eda_stats, train_results, best_name, stat_tests, forecast_data, pdf_path)
    
    return FileResponse(pdf_path, media_type="application/pdf", filename="reporte_analitica_restaurante.pdf")
