package com.los_patos.restaurant.repository;

import com.los_patos.restaurant.model.Empleado;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmpleadoRepository extends JpaRepository<Empleado, Integer> {
}
