package com.los_patos.restaurant.controller;

import com.los_patos.restaurant.model.Reserva;
import com.los_patos.restaurant.repository.ClienteRepository;
import com.los_patos.restaurant.repository.EmpleadoRepository;
import com.los_patos.restaurant.repository.MesaRepository;
import com.los_patos.restaurant.repository.ReservaRepository;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/reservas")
public class ReservaController {

    @Autowired
    private ReservaRepository reservaRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private MesaRepository mesaRepository;

    @Autowired
    private EmpleadoRepository empleadoRepository;

    @Data
    public static class ReservaDto {
        private Integer clienteId;
        private Integer mesaId;
        private Integer empleadoId;
        private String fechaReserva;
        private String horaReserva;
        private Integer numComensales;
        private String estadoReserva;
        private String tiempoOcupacionReal;
        private BigDecimal ingresoEstimado;
    }

    @GetMapping("/")
    public ResponseEntity<List<Reserva>> getReservas() {
        return ResponseEntity.ok(reservaRepository.findAll());
    }

    @PostMapping("/")
    public ResponseEntity<Reserva> createReserva(@RequestBody ReservaDto dto) {
        Reserva r = new Reserva();
        copyDtoToEntity(dto, r);
        Reserva saved = reservaRepository.save(r);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getReserva(@PathVariable("id") Integer id) {
        Optional<Reserva> opt = reservaRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("detail", "Reserva no encontrada"));
        }
        return ResponseEntity.ok(opt.get());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateReserva(@PathVariable("id") Integer id, @RequestBody ReservaDto dto) {
        Optional<Reserva> opt = reservaRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("detail", "Reserva no encontrada"));
        }
        Reserva r = opt.get();
        copyDtoToEntity(dto, r);
        Reserva updated = reservaRepository.save(r);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReserva(@PathVariable("id") Integer id) {
        Optional<Reserva> opt = reservaRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("detail", "Reserva no encontrada"));
        }
        reservaRepository.delete(opt.get());
        return ResponseEntity.ok(Map.of("message", "Reserva eliminada exitosamente"));
    }

    private void copyDtoToEntity(ReservaDto dto, Reserva r) {
        if (dto.getClienteId() != null) {
            r.setCliente(clienteRepository.findById(dto.getClienteId()).orElse(null));
        }
        if (dto.getMesaId() != null) {
            r.setMesa(mesaRepository.findById(dto.getMesaId()).orElse(null));
        }
        if (dto.getEmpleadoId() != null) {
            r.setEmpleado(empleadoRepository.findById(dto.getEmpleadoId()).orElse(null));
        }

        if (dto.getFechaReserva() != null) {
            r.setFechaReserva(LocalDate.parse(dto.getFechaReserva()));
        }
        if (dto.getHoraReserva() != null) {
            r.setHoraReserva(LocalTime.parse(dto.getHoraReserva()));
        }

        r.setNumComensales(dto.getNumComensales());
        if (dto.getEstadoReserva() != null) {
            r.setEstadoReserva(dto.getEstadoReserva());
        }
        r.setTiempoOcupacionReal(dto.getTiempoOcupacionReal());
        r.setIngresoEstimado(dto.getIngresoEstimado());
    }
}
