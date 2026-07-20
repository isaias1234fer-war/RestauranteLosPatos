package com.los_patos.restaurant.repository;

import com.los_patos.restaurant.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ClienteRepository extends JpaRepository<Cliente, Integer> {
    @Query("SELECT c FROM Cliente c WHERE LOWER(c.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(c.email) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Cliente> searchClientes(@Param("search") String search);
}
