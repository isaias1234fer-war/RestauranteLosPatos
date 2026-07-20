package com.los_patos.restaurant.controller;

import com.los_patos.restaurant.model.Cliente;
import com.los_patos.restaurant.repository.ClienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

    @Autowired
    private ClienteRepository clienteRepository;

    @GetMapping("/")
    public ResponseEntity<List<Cliente>> getClientes(@RequestParam(value = "search", required = false) String search) {
        if (search != null && !search.trim().isEmpty()) {
            return ResponseEntity.ok(clienteRepository.searchClientes(search));
        }
        return ResponseEntity.ok(clienteRepository.findAll());
    }

    @PostMapping("/")
    public ResponseEntity<Cliente> createCliente(@RequestBody Cliente cliente) {
        Cliente saved = clienteRepository.save(cliente);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCliente(@PathVariable("id") Integer id) {
        Optional<Cliente> opt = clienteRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapError("Cliente no encontrado"));
        }
        clienteRepository.delete(opt.get());
        Map<String, String> res = new HashMap<>();
        res.put("message", "Cliente eliminado exitosamente");
        return ResponseEntity.ok(res);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCliente(@PathVariable("id") Integer id, @RequestBody Cliente updatedData) {
        Optional<Cliente> opt = clienteRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapError("Cliente no encontrado"));
        }
        Cliente cliente = opt.get();
        cliente.setNombre(updatedData.getNombre());
        cliente.setEmail(updatedData.getEmail());
        cliente.setSegmento(updatedData.getSegmento());
        cliente.setPreferencias(updatedData.getPreferencias());
        cliente.setMetodoPagoHabitual(updatedData.getMetodoPagoHabitual());
        
        Cliente saved = clienteRepository.save(cliente);
        return ResponseEntity.ok(saved);
    }

    private Map<String, String> mapError(String msg) {
        Map<String, String> err = new HashMap<>();
        err.put("detail", msg);
        return err;
    }
}
