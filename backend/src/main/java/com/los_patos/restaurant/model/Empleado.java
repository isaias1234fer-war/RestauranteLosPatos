package com.los_patos.restaurant.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "empleados")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Empleado {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "empleado_id")
    private Integer empleadoId;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(length = 100, unique = true)
    private String email;

    @Column(name = "password_hash", length = 200)
    private String passwordHash;

    @Column(length = 30)
    private String rol;

    @Column(length = 20)
    private String turno;

    @Column(name = "fecha_contratacion")
    private LocalDateTime fechaContratacion = LocalDateTime.now();

    @Column(name = "estado_activo")
    private Boolean estadoActivo = true;
}
