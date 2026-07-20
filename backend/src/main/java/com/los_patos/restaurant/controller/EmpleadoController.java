package com.los_patos.restaurant.controller;

import com.los_patos.restaurant.model.Empleado;
import com.los_patos.restaurant.repository.EmpleadoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/empleados")
public class EmpleadoController {

    @Autowired
    private EmpleadoRepository empleadoRepository;

    @GetMapping("/")
    public ResponseEntity<List<Empleado>> getEmpleados() {
        return ResponseEntity.ok(empleadoRepository.findAll());
    }

    @PostMapping("/")
    public ResponseEntity<Empleado> createEmpleado(@RequestBody Empleado empleado) {
        Empleado saved = empleadoRepository.save(empleado);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getEmpleado(@PathVariable("id") Integer id) {
        Optional<Empleado> opt = empleadoRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("detail", "Empleado no encontrado"));
        }
        return ResponseEntity.ok(opt.get());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateEmpleado(@PathVariable("id") Integer id, @RequestBody Empleado dto) {
        Optional<Empleado> opt = empleadoRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("detail", "Empleado no encontrado"));
        }
        Empleado e = opt.get();
        e.setNombre(dto.getNombre());
        e.setEmail(dto.getEmail());
        if (dto.getPasswordHash() != null) {
            e.setPasswordHash(dto.getPasswordHash());
        }
        e.setRol(dto.getRol());
        e.setTurno(dto.getTurno());
        e.setEstadoActivo(dto.getEstadoActivo());
        Empleado updated = empleadoRepository.save(e);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEmpleado(@PathVariable("id") Integer id) {
        Optional<Empleado> opt = empleadoRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("detail", "Empleado no encontrado"));
        }
        empleadoRepository.delete(opt.get());
        return ResponseEntity.ok(Map.of("message", "Empleado eliminado exitosamente"));
    }
}
