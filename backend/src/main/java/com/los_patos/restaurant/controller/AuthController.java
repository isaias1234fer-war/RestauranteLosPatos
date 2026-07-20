package com.los_patos.restaurant.controller;

import com.los_patos.restaurant.model.Usuario;
import com.los_patos.restaurant.repository.UsuarioRepository;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Data
    public static class UsuarioRegisterDto {
        private String nombre;
        private String username;
        private String email;
        private String password;
    }

    @Data
    public static class UsuarioLoginDto {
        private String username;
        private String password;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody UsuarioRegisterDto dto) {
        if (usuarioRepository.existsByUsernameOrEmail(dto.getUsername(), dto.getEmail())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(MapResponse.of("detail", "El nombre de usuario o email ya está registrado"));
        }

        Usuario usuario = new Usuario();
        usuario.setNombre(dto.getNombre());
        usuario.setUsername(dto.getUsername());
        usuario.setEmail(dto.getEmail());
        usuario.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
        usuario.setRolSistema("empleado"); // Por defecto según FastAPI
        usuario.setEstadoActivo(true);
        usuario.setFechaCreacion(LocalDateTime.now());

        Usuario saved = usuarioRepository.save(usuario);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UsuarioLoginDto dto) {
        Optional<Usuario> optUser = usuarioRepository.findByUsername(dto.getUsername());
        if (optUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(MapResponse.of("detail", "Usuario o contraseña incorrectos"));
        }

        Usuario usuario = optUser.get();
        if (!usuario.getEstadoActivo()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(MapResponse.of("detail", "Usuario inactivo"));
        }

        // Verificar password (soportar texto plano heredado y BCrypt)
        String hash = usuario.getPasswordHash();
        boolean matches = false;
        if (hash != null) {
            if (hash.startsWith("$2b$") || hash.startsWith("$2a$")) {
                // Reemplazar prefijo si es $2b$ porque el parser de Java prefiere $2a$ o soporta $2b$ según versión
                String checkHash = hash;
                if (hash.startsWith("$2b$")) {
                    checkHash = "$2a$" + hash.substring(4);
                }
                try {
                    matches = passwordEncoder.matches(dto.getPassword(), checkHash);
                } catch (Exception e) {
                    matches = dto.getPassword().equals(hash);
                }
            } else {
                matches = dto.getPassword().equals(hash);
            }
        }

        if (!matches) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(MapResponse.of("detail", "Usuario o contraseña incorrectos"));
        }

        usuario.setUltimoLogin(LocalDateTime.now());
        usuarioRepository.save(usuario);

        return ResponseEntity.ok(usuario);
    }

    private static class MapResponse extends java.util.HashMap<String, String> {
        public static MapResponse of(String k, String v) {
            MapResponse map = new MapResponse();
            map.put(k, v);
            return map;
        }
    }
}
