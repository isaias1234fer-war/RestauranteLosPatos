package com.los_patos.restaurant.model.analytics;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "dim_tiempo")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DimTiempo {
    @Id
    @Column(name = "tiempo_id")
    private Integer tiempoId;

    @Column(nullable = false)
    private LocalDate fecha;

    private LocalTime hora;

    @Column(name = "dia_semana", length = 20)
    private String diaSemana;

    @Column(length = 20)
    private String mes;

    @Column(length = 20)
    private String temporada;

    @Column(length = 50)
    private String festividad;

    @Column(name = "feriado_local")
    private Boolean feriadoLocal = false;
}
