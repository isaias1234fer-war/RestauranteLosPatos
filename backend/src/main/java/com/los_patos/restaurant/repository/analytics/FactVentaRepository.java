package com.los_patos.restaurant.repository.analytics;

import com.los_patos.restaurant.model.analytics.FactVenta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface FactVentaRepository extends JpaRepository<FactVenta, Integer> {
    @Query("SELECT DISTINCT f.tiempo.fecha FROM FactVenta f")
    List<java.time.LocalDate> findDistinctFechas();
}
