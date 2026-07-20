package com.los_patos.restaurant.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "mesas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Mesa {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "mesa_id")
    private Integer mesaId;

    @Column(name = "numero_mesa", nullable = false, unique = true)
    private Integer numeroMesa;

    @Column(length = 30)
    private String ubicacion;

    private Integer capacidad;

    @Column(name = "estado_actual", length = 20)
    private String estadoActual = "libre";
}
