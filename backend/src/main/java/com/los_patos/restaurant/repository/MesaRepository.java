package com.los_patos.restaurant.repository;

import com.los_patos.restaurant.model.Mesa;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface MesaRepository extends JpaRepository<Mesa, Integer> {
    Optional<Mesa> findByNumeroMesa(Integer numeroMesa);
}
