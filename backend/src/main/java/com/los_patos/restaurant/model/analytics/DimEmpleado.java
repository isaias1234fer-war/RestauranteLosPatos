package com.los_patos.restaurant.model.analytics;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "dim_empleado")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DimEmpleado {
    @Id
    @Column(name = "empleado_id")
    private Integer empleadoId;

    @Column(length = 100)
    private String nombre;

    @Column(length = 100)
    private String email;

    @Column(length = 30)
    private String rol;

    @Column(length = 20)
    private String turno;

    @Column(name = "antiguedad_meses")
    private Integer antiguedadMeses;

    @Column(name = "estado_activo")
    private Boolean estadoActivo;
}
