package com.los_patos.restaurant.model.analytics;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "fact_ventas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FactVenta {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "venta_sk")
    private Integer ventaSk;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tiempo_id")
    private DimTiempo tiempo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id")
    private DimProducto producto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id")
    private DimCliente cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empleado_id")
    private DimEmpleado empleado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mesa_id")
    private DimMesa mesa;

    @Column(name = "cantidad_vendida")
    private Integer cantidadVendida;

    @Column(name = "monto_total_linea", precision = 12, scale = 2)
    private BigDecimal montoTotalLinea;

    @Column(name = "descuento_aplicado", precision = 10, scale = 2)
    private BigDecimal descuentoAplicado;

    @Column(name = "propina_proporcional", precision = 10, scale = 2)
    private BigDecimal propinaProporcional;

    @Column(name = "costo_insumos_real", precision = 12, scale = 2)
    private BigDecimal costoInsumosReal;

    @Column(name = "margen_bruto_real", precision = 12, scale = 2)
    private BigDecimal margenBrutoReal;

    @Column(name = "tiempo_preparacion_real")
    private String tiempoPreparacionReal;

    @Column(name = "estado_cocina_final", length = 20)
    private String estadoCocinaFinal;
}
