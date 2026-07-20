package com.los_patos.restaurant.repository;

import com.los_patos.restaurant.model.EstadoCocina;
import com.los_patos.restaurant.model.VentaDetalle;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VentaDetalleRepository extends JpaRepository<VentaDetalle, Integer> {
    List<VentaDetalle> findByEstadoCocinaIn(List<EstadoCocina> estados);
}
