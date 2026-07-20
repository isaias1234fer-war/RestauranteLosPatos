package com.los_patos.restaurant.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "productos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Producto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "producto_id")
    private Integer productoId;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(length = 50)
    private String categoria;

    @Column(length = 50)
    private String subcategoria;

    @Column(name = "precio_venta", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioVenta;

    @Column(name = "costo_produccion", precision = 10, scale = 2)
    private BigDecimal costoProduccion;

    @Column(name = "tiempo_preparacion_est")
    private String tiempoPreparacionEst;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proveedor_id")
    private Proveedor proveedor;
}
