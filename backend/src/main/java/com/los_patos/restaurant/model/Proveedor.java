package com.los_patos.restaurant.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "proveedores")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Proveedor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "proveedor_id")
    private Integer proveedorId;

    @Column(nullable = false, length = 100)
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
