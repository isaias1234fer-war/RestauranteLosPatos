package com.los_patos.restaurant.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "ventas_detalle")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VentaDetalle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "detalle_id")
    private Integer detalleId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "venta_id", nullable = false)
    @JsonIgnore
    private VentaEncabezado venta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id")
    private Producto producto;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(name = "precio_unitario_momento", precision = 10, scale = 2)
    private BigDecimal precioUnitarioMomento;

    @Column(name = "tiempo_preparacion_real")
    private String tiempoPreparacionReal;

    @Column(name = "estado_cocina")
    @Enumerated(EnumType.STRING)
    private EstadoCocina estadoCocina = EstadoCocina.pendiente;
}
