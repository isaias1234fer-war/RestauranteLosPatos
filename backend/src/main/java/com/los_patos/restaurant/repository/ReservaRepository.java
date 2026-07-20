package com.los_patos.restaurant.repository;

import com.los_patos.restaurant.model.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReservaRepository extends JpaRepository<Reserva, Integer> {
}
