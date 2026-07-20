package com.los_patos.restaurant.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ventas_encabezado")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VentaEncabezado {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "venta_id")
    private Integer ventaId;

    @Column(name = "fecha_hora")
    private LocalDateTime fechaHora = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empleado_id")
    private Empleado empleado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mesa_id")
    private Mesa mesa;

    @Column(precision = 12, scale = 2)
    private BigDecimal subtotal;

    @Column(precision = 12, scale = 2)
    private BigDecimal impuestos;

    @Column(precision = 10, scale = 2)
    private BigDecimal propina;

    @Column(name = "descuento_aplicado", precision = 10, scale = 2)
    private BigDecimal descuentoAplicado;

    @Column(name = "total_final", precision = 12, scale = 2)
    private BigDecimal totalFinal;

    @OneToMany(mappedBy = "venta", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<VentaDetalle> detalles = new ArrayList<>();
}
