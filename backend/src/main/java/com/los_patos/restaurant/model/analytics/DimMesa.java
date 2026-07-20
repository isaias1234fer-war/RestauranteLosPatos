package com.los_patos.restaurant.model.analytics;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "dim_mesa")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DimMesa {
    @Id
    @Column(name = "mesa_id")
    private Integer mesaId;

    @Column(name = "numero_mesa")
    private Integer numeroMesa;

    @Column(length = 30)
    private String ubicacion;

    private Integer capacidad;

    @Column(name = "estado_actual", length = 20)
    private String estadoActual;
}
