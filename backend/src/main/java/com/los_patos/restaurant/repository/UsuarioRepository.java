package com.los_patos.restaurant.repository;

import com.los_patos.restaurant.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {
    Optional<Usuario> findByUsername(String username);
    boolean existsByUsernameOrEmail(String username, String email);
}
