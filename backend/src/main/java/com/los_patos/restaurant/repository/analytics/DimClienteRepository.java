package com.los_patos.restaurant.repository.analytics;

import com.los_patos.restaurant.model.analytics.DimCliente;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DimClienteRepository extends JpaRepository<DimCliente, Integer> {
}
