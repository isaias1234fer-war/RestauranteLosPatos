package com.los_patos.restaurant.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "usuarios")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Usuario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "usuario_id")
    private Integer usuarioId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empleado_id", unique = true)
    private Empleado empleado;

    @Column(length = 50)
    private String nombre;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "rol_sistema", nullable = false, length = 20)
    private String rolSistema;

    @Column(name = "ultimo_login")
    private LocalDateTime ultimoLogin;

    @Column(name = "estado_activo")
    private Boolean estadoActivo = true;

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion = LocalDateTime.now();
}
