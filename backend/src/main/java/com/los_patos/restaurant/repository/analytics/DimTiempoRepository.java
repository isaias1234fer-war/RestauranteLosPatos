package com.los_patos.restaurant.repository.analytics;

import com.los_patos.restaurant.model.analytics.DimTiempo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.Optional;

public interface DimTiempoRepository extends JpaRepository<DimTiempo, Integer> {
    Optional<DimTiempo> findByFecha(LocalDate fecha);
}
