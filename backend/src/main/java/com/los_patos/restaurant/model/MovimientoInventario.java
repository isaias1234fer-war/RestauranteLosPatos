package com.los_patos.restaurant.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "movimientos_inventario")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MovimientoInventario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "movimiento_id")
    private Integer movimientoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id")
    private Producto producto;

    @Column(name = "tipo_movimiento", length = 20)
    private String tipoMovimiento;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal cantidad;

    @Column(name = "fecha_movimiento")
    private LocalDateTime fechaMovimiento = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proveedor_id")
    private Proveedor proveedor;

    @Column(name = "costo_unitario_lote", precision = 10, scale = 2)
    private BigDecimal costoUnitarioLote;
}
