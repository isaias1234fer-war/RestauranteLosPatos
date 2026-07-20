package com.los_patos.restaurant.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "clientes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Cliente {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cliente_id")
    private Integer clienteId;

    @Column(length = 100)
    private String nombre;

    @Column(length = 100, unique = true)
    private String email;

    @Column(length = 30)
    private String segmento;

    @Column(columnDefinition = "TEXT")
    private String preferencias;

    @Column(name = "metodo_pago_habitual", length = 30)
    private String metodoPagoHabitual;
}
