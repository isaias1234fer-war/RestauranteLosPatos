package com.los_patos.restaurant.controller;

import com.los_patos.restaurant.model.Mesa;
import com.los_patos.restaurant.repository.MesaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mesas")
public class MesaController {

    @Autowired
    private MesaRepository mesaRepository;

    @GetMapping("/")
    public ResponseEntity<List<Mesa>> getMesas() {
        return ResponseEntity.ok(mesaRepository.findAll());
    }

    @PostMapping("/")
    public ResponseEntity<Mesa> createMesa(@RequestBody Mesa mesa) {
        Mesa saved = mesaRepository.save(mesa);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateMesa(@PathVariable("id") Integer id, @RequestBody Mesa updatedData) {
        return mesaRepository.findById(id).map(m -> {
            m.setNumeroMesa(updatedData.getNumeroMesa());
            m.setUbicacion(updatedData.getUbicacion());
            m.setCapacidad(updatedData.getCapacidad());
            m.setEstadoActual(updatedData.getEstadoActual());
            Mesa saved = mesaRepository.save(m);
            return ResponseEntity.ok(saved);
        }).orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMesa(@PathVariable("id") Integer id) {
        return mesaRepository.findById(id).map(m -> {
            mesaRepository.delete(m);
            java.util.Map<String, String> res = new java.util.HashMap<>();
            res.put("message", "Mesa eliminada exitosamente");
            return ResponseEntity.ok(res);
        }).orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }
}
