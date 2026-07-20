package com.los_patos.restaurant.model.analytics;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "dim_producto")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DimProducto {
    @Id
    @Column(name = "producto_id")
    private Integer productoId;

    @Column(length = 100)
    private String nombre;

    @Column(length = 50)
    private String categoria;

    @Column(length = 50)
    private String subcategoria;

    @Column(name = "precio_actual", precision = 10, scale = 2)
    private BigDecimal precioActual;

    @Column(name = "costo_actual", precision = 10, scale = 2)
    private BigDecimal costoActual;

    @Column(name = "margen_teorico", precision = 10, scale = 2)
    private BigDecimal margenTeorico;

    @Column(name = "proveedor_principal_id")
    private Integer proveedorPrincipalId;

    @Column(name = "tiempo_preparacion_est")
    private String tiempoPreparacionEst;
}
