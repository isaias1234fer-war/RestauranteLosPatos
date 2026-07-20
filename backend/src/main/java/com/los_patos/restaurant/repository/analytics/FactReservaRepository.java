package com.los_patos.restaurant.repository.analytics;

import com.los_patos.restaurant.model.analytics.FactReserva;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FactReservaRepository extends JpaRepository<FactReserva, Integer> {
}
