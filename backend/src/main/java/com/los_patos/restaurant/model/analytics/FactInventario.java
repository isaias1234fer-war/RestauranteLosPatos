package com.los_patos.restaurant.model.analytics;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "fact_inventario")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FactInventario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "inventario_sk")
    private Integer inventarioSk;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tiempo_id")
    private DimTiempo tiempo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id")
    private DimProducto producto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proveedor_id")
    private DimProveedor proveedor;

    @Column(name = "cantidad_ingresada", precision = 10, scale = 2)
    private BigDecimal cantidadIngresada;

    @Column(name = "cantidad_consumida", precision = 10, scale = 2)
    private BigDecimal cantidadConsumida;

    @Column(precision = 10, scale = 2)
    private BigDecimal mermas;

    @Column(name = "stock_final_periodo", precision = 10, scale = 2)
    private BigDecimal stockFinalPeriodo;

    @Column(name = "valor_monetario_stock", precision = 12, scale = 2)
    private BigDecimal valorMonetarioStock;

    @Column(name = "dias_inventario")
    private Integer diasInventario;
}
