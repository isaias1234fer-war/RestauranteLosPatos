package com.los_patos.restaurant.service;

import com.los_patos.restaurant.model.*;
import com.los_patos.restaurant.model.analytics.*;
import com.los_patos.restaurant.repository.*;
import com.los_patos.restaurant.repository.analytics.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.*;

@Service
public class AnaliticaService {

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private ProductoRepository productoRepository;
    @Autowired
    private ClienteRepository clienteRepository;
    @Autowired
    private EmpleadoRepository empleadoRepository;
    @Autowired
    private MesaRepository mesaRepository;
    @Autowired
    private VentaEncabezadoRepository ventaEncabezadoRepository;

    @Autowired
    private DimTiempoRepository dimTiempoRepository;
    @Autowired
    private DimProductoRepository dimProductoRepository;
    @Autowired
    private DimClienteRepository dimClienteRepository;
    @Autowired
    private DimEmpleadoRepository dimEmpleadoRepository;
    @Autowired
    private DimMesaRepository dimMesaRepository;
    @Autowired
    private FactVentaRepository factVentaRepository;

    @Transactional
    public Map<String, String> syncData() {
        // 1. Limpiar Hechos y Dimensiones (en orden para no romper FKs)
        entityManager.createNativeQuery("TRUNCATE TABLE fact_ventas, fact_inventario, fact_reservas, dim_tiempo, dim_producto, dim_cliente, dim_empleado, dim_mesa, dim_proveedor RESTART IDENTITY CASCADE").executeUpdate();

        // 2. Llenar Dimensiones
        // DimProducto
        List<Producto> productos = productoRepository.findAll();
        for (Producto p : productos) {
            DimProducto dp = new DimProducto();
            dp.setProductoId(p.getProductoId());
            dp.setNombre(p.getNombre());
            dp.setCategoria(p.getCategoria());
            dp.setSubcategoria(p.getSubcategoria());
            dp.setPrecioActual(p.getPrecioVenta());
            dp.setCostoActual(p.getCostoProduccion());
            if (p.getPrecioVenta() != null && p.getCostoProduccion() != null) {
                dp.setMargenTeorico(p.getPrecioVenta().subtract(p.getCostoProduccion()));
            }
            dp.setTiempoPreparacionEst(p.getTiempoPreparacionEst());
            if (p.getProveedor() != null) {
                dp.setProveedorPrincipalId(p.getProveedor().getProveedorId());
            }
            dimProductoRepository.save(dp);
        }

        // DimCliente
        List<Cliente> clientes = clienteRepository.findAll();
        for (Cliente c : clientes) {
            DimCliente dc = new DimCliente();
            dc.setClienteId(c.getClienteId());
            dc.setNombre(c.getNombre());
            dc.setEmail(c.getEmail());
            dc.setSegmento(c.getSegmento());
            dc.setPreferencias(c.getPreferencias());
            dc.setMetodoPagoPreferido(c.getMetodoPagoHabitual());
            dimClienteRepository.save(dc);
        }

        // DimEmpleado
        List<Empleado> empleados = empleadoRepository.findAll();
        for (Empleado e : empleados) {
            DimEmpleado de = new DimEmpleado();
            de.setEmpleadoId(e.getEmpleadoId());
            de.setNombre(e.getNombre());
            de.setEmail(e.getEmail());
            de.setRol(e.getRol());
            de.setTurno(e.getTurno());
            de.setEstadoActivo(e.getEstadoActivo());
            dimEmpleadoRepository.save(de);
        }

        // DimMesa
        List<Mesa> mesas = mesaRepository.findAll();
        for (Mesa m : mesas) {
            DimMesa dm = new DimMesa();
            dm.setMesaId(m.getMesaId());
            dm.setNumeroMesa(m.getNumeroMesa());
            dm.setUbicacion(m.getUbicacion());
            dm.setCapacidad(m.getCapacidad());
            dm.setEstadoActual(m.getEstadoActual());
            dimMesaRepository.save(dm);
        }

        // DimTiempo y FactVentas
        List<VentaEncabezado> ventasEnc = ventaEncabezadoRepository.findAll();
        Map<LocalDate, DimTiempo> fechaToDimTiempo = new HashMap<>();
        int tiempoIdCounter = 1;

        for (VentaEncabezado ve : ventasEnc) {
            if (ve.getFechaHora() == null) continue;
            LocalDate fecha = ve.getFechaHora().toLocalDate();

            if (!fechaToDimTiempo.containsKey(fecha)) {
                DimTiempo dt = new DimTiempo();
                dt.setTiempoId(tiempoIdCounter++);
                dt.setFecha(fecha);
                dt.setMes(fecha.getMonth().getDisplayName(TextStyle.FULL, new Locale("es", "ES")));
                dt.setDiaSemana(fecha.getDayOfWeek().getDisplayName(TextStyle.FULL, new Locale("es", "ES")));
                dimTiempoRepository.save(dt);
                fechaToDimTiempo.put(fecha, dt);
            }
        }

        // 3. Llenar Hechos de Ventas
        for (VentaEncabezado ve : ventasEnc) {
            if (ve.getFechaHora() == null) continue;
            LocalDate fecha = ve.getFechaHora().toLocalDate();
            DimTiempo t = fechaToDimTiempo.get(fecha);

            if (ve.getDetalles() == null || ve.getDetalles().isEmpty()) {
                FactVenta fv = new FactVenta();
                fv.setTiempo(t);
                fv.setCliente(ve.getCliente() != null ? dimClienteRepository.findById(ve.getCliente().getClienteId()).orElse(null) : null);
                fv.setEmpleado(ve.getEmpleado() != null ? dimEmpleadoRepository.findById(ve.getEmpleado().getEmpleadoId()).orElse(null) : null);
                fv.setMesa(ve.getMesa() != null ? dimMesaRepository.findById(ve.getMesa().getMesaId()).orElse(null) : null);
                fv.setCantidadVendida(1);
                fv.setMontoTotalLinea(ve.getSubtotal() != null ? ve.getSubtotal() : ve.getTotalFinal());
                fv.setDescuentoAplicado(ve.getDescuentoAplicado());
                fv.setPropinaProporcional(ve.getPropina());
                fv.setEstadoCocinaFinal("completado");
                factVentaRepository.save(fv);
            } else {
                for (VentaDetalle det : ve.getDetalles()) {
                    FactVenta fv = new FactVenta();
                    fv.setTiempo(t);
                    fv.setProducto(det.getProducto() != null ? dimProductoRepository.findById(det.getProducto().getProductoId()).orElse(null) : null);
                    fv.setCliente(ve.getCliente() != null ? dimClienteRepository.findById(ve.getCliente().getClienteId()).orElse(null) : null);
                    fv.setEmpleado(ve.getEmpleado() != null ? dimEmpleadoRepository.findById(ve.getEmpleado().getEmpleadoId()).orElse(null) : null);
                    fv.setMesa(ve.getMesa() != null ? dimMesaRepository.findById(ve.getMesa().getMesaId()).orElse(null) : null);
                    fv.setCantidadVendida(det.getCantidad());

                    BigDecimal precio = det.getPrecioUnitarioMomento();
                    if (precio != null && det.getCantidad() != null) {
                        fv.setMontoTotalLinea(precio.multiply(BigDecimal.valueOf(det.getCantidad())));
                    } else {
                        fv.setMontoTotalLinea(BigDecimal.ZERO);
                    }
                    fv.setTiempoPreparacionReal(det.getTiempoPreparacionReal());
                    fv.setEstadoCocinaFinal(det.getEstadoCocina() != null ? det.getEstadoCocina().name() : "pendiente");
                    factVentaRepository.save(fv);
                }
            }
        }

        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "ETL completado. Data Warehouse sincronizado.");
        return response;
    }

    public Map<String, Object> getFiltros() {
        List<LocalDate> fechas = factVentaRepository.findDistinctFechas();
        Set<Integer> years = new TreeSet<>();
        Set<String> months = new LinkedHashSet<>(); // Mantener orden

        for (LocalDate f : fechas) {
            if (f != null) {
                years.add(f.getYear());
                months.add(f.getMonth().getDisplayName(TextStyle.FULL, new Locale("es", "ES")));
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("years", years);
        response.put("months", months);
        return response;
    }

    public Map<String, Object> getKpis(Integer year, String month) {
        // Obtenemos todos los registros de FactVenta
        List<FactVenta> factVentas = factVentaRepository.findAll();

        // Filtrar en memoria para máxima flexibilidad y corrección con localizaciones
        List<FactVenta> filtered = new ArrayList<>();
        for (FactVenta f : factVentas) {
            if (f.getTiempo() == null) continue;
            LocalDate fecha = f.getTiempo().getFecha();
            if (year != null && fecha.getYear() != year) continue;
            if (month != null && !month.trim().isEmpty()) {
                String mName = fecha.getMonth().getDisplayName(TextStyle.FULL, new Locale("es", "ES"));
                if (!mName.equalsIgnoreCase(month.trim())) continue;
            }
            filtered.add(f);
        }

        BigDecimal totalIngresos = BigDecimal.ZERO;
        int totalPlatos = 0;

        Map<String, BigDecimal> categoriaSales = new HashMap<>();
        Map<String, BigDecimal> empleadoSales = new HashMap<>();
        Map<String, BigDecimal> productoSales = new HashMap<>();
        Map<String, BigDecimal> mesSales = new HashMap<>();
        Map<String, BigDecimal> clienteSales = new HashMap<>();
        
        String[] mesesNombres = {"enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"};
        for (String m : mesesNombres) {
            mesSales.put(m, BigDecimal.ZERO);
        }

        Map<Integer, BigDecimal> diaSales = new TreeMap<>();
        if (year != null && month != null && !month.trim().isEmpty()) {
            int monthIndex = 1;
            for (int i = 0; i < mesesNombres.length; i++) {
                if (mesesNombres[i].equalsIgnoreCase(month.trim())) {
                    monthIndex = i + 1;
                    break;
                }
            }
            try {
                int lengthOfMonth = LocalDate.of(year, monthIndex, 1).lengthOfMonth();
                for (int d = 1; d <= lengthOfMonth; d++) {
                    diaSales.put(d, BigDecimal.ZERO);
                }
            } catch (Exception e) {
                // Safe fallback in case of invalid date components
            }
        }

        Map<Integer, BigDecimal> anioSales = new TreeMap<>();

        for (FactVenta f : filtered) {
            BigDecimal monto = f.getMontoTotalLinea() != null ? f.getMontoTotalLinea() : BigDecimal.ZERO;
            totalIngresos = totalIngresos.add(monto);
            totalPlatos += f.getCantidadVendida() != null ? f.getCantidadVendida() : 0;

            // Por categoría
            String cat = (f.getProducto() != null && f.getProducto().getCategoria() != null) 
                    ? f.getProducto().getCategoria() : "Sin Categoría";
            categoriaSales.put(cat, categoriaSales.getOrDefault(cat, BigDecimal.ZERO).add(monto));

            // Por empleado
            String emp = (f.getEmpleado() != null && f.getEmpleado().getNombre() != null) 
                    ? f.getEmpleado().getNombre() : "Desconocido";
            empleadoSales.put(emp, empleadoSales.getOrDefault(emp, BigDecimal.ZERO).add(monto));

            // Por producto
            String prod = (f.getProducto() != null && f.getProducto().getNombre() != null) 
                    ? f.getProducto().getNombre() : "Desconocido";
            productoSales.put(prod, productoSales.getOrDefault(prod, BigDecimal.ZERO).add(monto));

            // Por cliente
            String cli = (f.getCliente() != null && f.getCliente().getNombre() != null) 
                    ? f.getCliente().getNombre() : "Cliente General";
            clienteSales.put(cli, clienteSales.getOrDefault(cli, BigDecimal.ZERO).add(monto));

            // Por mes
            String mesName = (f.getTiempo() != null && f.getTiempo().getMes() != null) 
                    ? f.getTiempo().getMes().toLowerCase() : "desconocido";
            mesSales.put(mesName, mesSales.getOrDefault(mesName, BigDecimal.ZERO).add(monto));

            // Por día
            if (year != null && month != null && !month.trim().isEmpty() && f.getTiempo() != null && f.getTiempo().getFecha() != null) {
                int day = f.getTiempo().getFecha().getDayOfMonth();
                diaSales.put(day, diaSales.getOrDefault(day, BigDecimal.ZERO).add(monto));
            }

            // Por año
            if (year == null && f.getTiempo() != null && f.getTiempo().getFecha() != null) {
                int y = f.getTiempo().getFecha().getYear();
                anioSales.put(y, anioSales.getOrDefault(y, BigDecimal.ZERO).add(monto));
            }
        }

        // Formatear resultados agrupados para JSON
        List<Map<String, Object>> cliData = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> entry : clienteSales.entrySet()) {
            Map<String, Object> map = new HashMap<>();
            map.put("cliente", entry.getKey());
            map.put("total", entry.getValue());
            cliData.add(map);
        }

        List<Map<String, Object>> catData = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> entry : categoriaSales.entrySet()) {
            Map<String, Object> map = new HashMap<>();
            map.put("categoria", entry.getKey());
            map.put("total", entry.getValue());
            catData.add(map);
        }

        List<Map<String, Object>> empData = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> entry : empleadoSales.entrySet()) {
            Map<String, Object> map = new HashMap<>();
            map.put("empleado", entry.getKey());
            map.put("total", entry.getValue());
            empData.add(map);
        }

        List<Map<String, Object>> prodData = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> entry : productoSales.entrySet()) {
            Map<String, Object> map = new HashMap<>();
            map.put("producto", entry.getKey());
            map.put("total", entry.getValue());
            prodData.add(map);
        }

        List<Map<String, Object>> mesData = new ArrayList<>();
        for (String m : mesesNombres) {
            BigDecimal total = mesSales.getOrDefault(m, BigDecimal.ZERO);
            if (total.compareTo(BigDecimal.ZERO) > 0) {
                Map<String, Object> map = new HashMap<>();
                map.put("mes", m.substring(0, 1).toUpperCase() + m.substring(1));
                map.put("total", total);
                mesData.add(map);
            }
        }
        for (Map.Entry<String, BigDecimal> entry : mesSales.entrySet()) {
            String mName = entry.getKey();
            if (!Arrays.asList(mesesNombres).contains(mName) && entry.getValue().compareTo(BigDecimal.ZERO) > 0) {
                Map<String, Object> map = new HashMap<>();
                map.put("mes", mName.substring(0, 1).toUpperCase() + mName.substring(1));
                map.put("total", entry.getValue());
                mesData.add(map);
            }
        }

        List<Map<String, Object>> diaData = new ArrayList<>();
        for (Map.Entry<Integer, BigDecimal> entry : diaSales.entrySet()) {
            Map<String, Object> map = new HashMap<>();
            map.put("dia", entry.getKey());
            map.put("total", entry.getValue());
            diaData.add(map);
        }

        List<Map<String, Object>> anioData = new ArrayList<>();
        for (Map.Entry<Integer, BigDecimal> entry : anioSales.entrySet()) {
            Map<String, Object> map = new HashMap<>();
            map.put("anio", entry.getKey());
            map.put("total", entry.getValue());
            anioData.add(map);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("total_ingresos", totalIngresos);
        response.put("total_platos", totalPlatos);
        response.put("ventas_por_categoria", catData);
        response.put("ventas_por_empleado", empData);
        response.put("ventas_por_producto", prodData);
        response.put("ventas_por_mes", mesData);
        response.put("ventas_por_dia", diaData);
        response.put("ventas_por_anio", anioData);
        response.put("ventas_por_cliente", cliData);

        return response;
    }
}
