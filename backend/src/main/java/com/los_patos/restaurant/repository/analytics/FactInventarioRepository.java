package com.los_patos.restaurant.repository.analytics;

import com.los_patos.restaurant.model.analytics.FactInventario;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FactInventarioRepository extends JpaRepository<FactInventario, Integer> {
}
