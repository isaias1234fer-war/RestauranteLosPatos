package com.los_patos.restaurant.repository.analytics;

import com.los_patos.restaurant.model.analytics.DimEmpleado;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DimEmpleadoRepository extends JpaRepository<DimEmpleado, Integer> {
}
