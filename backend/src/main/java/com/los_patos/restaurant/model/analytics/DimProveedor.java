package com.los_patos.restaurant.model.analytics;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "dim_proveedor")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DimProveedor {
    @Id
    @Column(name = "proveedor_id")
    private Integer proveedorId;

    @Column(length = 100)
    private String nombre;

    @Column(name = "tipo_insumo", length = 50)
    private String tipoInsumo;

    @Column(name = "frecuencia_entrega", length = 30)
    private String frecuenciaEntrega;

    @Column(name = "fiabilidad_puntuacion")
    private Integer fiabilidadPuntuacion;

    @Column(columnDefinition = "TEXT")
    private String condicionesPago;
}
