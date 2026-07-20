package com.los_patos.restaurant.controller;

import com.los_patos.restaurant.model.MovimientoInventario;
import com.los_patos.restaurant.repository.MovimientoInventarioRepository;
import com.los_patos.restaurant.repository.ProductoRepository;
import com.los_patos.restaurant.repository.ProveedorRepository;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/inventario")
public class InventarioController {

    @Autowired
    private MovimientoInventarioRepository movimientoInventarioRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private ProveedorRepository proveedorRepository;

    @Data
    public static class MovimientoInventarioDto {
        private Integer productoId;
        private Integer proveedorId;
        private BigDecimal cantidad;
        private String tipoMovimiento;
        private String fechaMovimiento;
        private BigDecimal costoUnitario;
        private BigDecimal valorTotal;
        private String observaciones;
    }

    @GetMapping("/")
    public ResponseEntity<List<MovimientoInventario>> getMovimientos() {
        return ResponseEntity.ok(movimientoInventarioRepository.findAll());
    }

    @PostMapping("/")
    public ResponseEntity<MovimientoInventario> createMovimiento(@RequestBody MovimientoInventarioDto dto) {
        MovimientoInventario m = new MovimientoInventario();
        copyDtoToEntity(dto, m);
        MovimientoInventario saved = movimientoInventarioRepository.save(m);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getMovimiento(@PathVariable("id") Integer id) {
        Optional<MovimientoInventario> opt = movimientoInventarioRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("detail", "Movimiento no encontrado"));
        }
        return ResponseEntity.ok(opt.get());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMovimiento(@PathVariable("id") Integer id) {
        Optional<MovimientoInventario> opt = movimientoInventarioRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("detail", "Movimiento no encontrado"));
        }
        movimientoInventarioRepository.delete(opt.get());
        return ResponseEntity.ok(Map.of("message", "Movimiento eliminado exitosamente"));
    }

    private void copyDtoToEntity(MovimientoInventarioDto dto, MovimientoInventario m) {
        if (dto.getProductoId() != null) {
            m.setProducto(productoRepository.findById(dto.getProductoId()).orElse(null));
        }
        if (dto.getProveedorId() != null) {
            m.setProveedor(proveedorRepository.findById(dto.getProveedorId()).orElse(null));
        }

        m.setCantidad(dto.getCantidad());
        m.setTipoMovimiento(dto.getTipoMovimiento());

        if (dto.getFechaMovimiento() != null) {
            m.setFechaMovimiento(LocalDateTime.parse(dto.getFechaMovimiento()));
        } else {
            m.setFechaMovimiento(LocalDateTime.now());
        }

        m.setCostoUnitarioLote(dto.getCostoUnitario());
    }
}
