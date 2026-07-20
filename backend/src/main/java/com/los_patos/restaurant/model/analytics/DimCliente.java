package com.los_patos.restaurant.model.analytics;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "dim_cliente")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DimCliente {
    @Id
    @Column(name = "cliente_id")
    private Integer clienteId;

    @Column(length = 100)
    private String nombre;

    @Column(length = 100)
    private String email;

    @Column(length = 30)
    private String segmento;

    @Column(name = "frecuencia_visita", length = 30)
    private String frecuenciaVisita;

    @Column(columnDefinition = "TEXT")
    private String preferencias;

    @Column(name = "metodo_pago_preferido", length = 30)
    private String metodoPagoPreferido;
}
