package com.los_patos.restaurant.repository.analytics;

import com.los_patos.restaurant.model.analytics.DimProducto;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DimProductoRepository extends JpaRepository<DimProducto, Integer> {
}
