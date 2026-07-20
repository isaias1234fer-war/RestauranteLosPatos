package com.los_patos.restaurant.controller;

import com.los_patos.restaurant.model.Producto;
import com.los_patos.restaurant.model.Proveedor;
import com.los_patos.restaurant.repository.ProductoRepository;
import com.los_patos.restaurant.repository.ProveedorRepository;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/catalogo")
public class CatalogoController {

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private ProveedorRepository proveedorRepository;

    @Data
    public static class ProductoDto {
        private String nombre;
        private String categoria;
        private String subcategoria;
        private BigDecimal precioVenta;
        private BigDecimal costoProduccion;
        private String tiempoPreparacionEst;
        private Integer proveedorId;
    }

    // --- PRODUCTOS ---

    @GetMapping("/productos/")
    public ResponseEntity<List<Producto>> getProductos() {
        return ResponseEntity.ok(productoRepository.findAll());
    }

    @PostMapping("/productos/")
    public ResponseEntity<Producto> createProducto(@RequestBody ProductoDto dto) {
        Producto p = new Producto();
        copyDtoToEntity(dto, p);
        Producto saved = productoRepository.save(p);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/productos/{id}")
    public ResponseEntity<?> getProducto(@PathVariable("id") Integer id) {
        Optional<Producto> opt = productoRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapError("Producto no encontrado"));
        }
        return ResponseEntity.ok(opt.get());
    }

    @PutMapping("/productos/{id}")
    public ResponseEntity<?> updateProducto(@PathVariable("id") Integer id, @RequestBody ProductoDto dto) {
        Optional<Producto> opt = productoRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapError("Producto no encontrado"));
        }
        Producto p = opt.get();
        copyDtoToEntity(dto, p);
        Producto updated = productoRepository.save(p);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/productos/{id}")
    public ResponseEntity<?> deleteProducto(@PathVariable("id") Integer id) {
        Optional<Producto> opt = productoRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapError("Producto no encontrado"));
        }
        productoRepository.delete(opt.get());
        Map<String, String> res = new HashMap<>();
        res.put("message", "Producto eliminado exitosamente");
        return ResponseEntity.ok(res);
    }

    // --- PROVEEDORES ---

    @GetMapping("/proveedores/")
    public ResponseEntity<List<Proveedor>> getProveedores() {
        return ResponseEntity.ok(proveedorRepository.findAll());
    }

    @PostMapping("/proveedores/")
    public ResponseEntity<Proveedor> createProveedor(@RequestBody Proveedor proveedor) {
        Proveedor saved = proveedorRepository.save(proveedor);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    private void copyDtoToEntity(ProductoDto dto, Producto p) {
        p.setNombre(dto.getNombre());
        p.setCategoria(dto.getCategoria());
        p.setSubcategoria(dto.getSubcategoria());
        p.setPrecioVenta(dto.getPrecioVenta());
        p.setCostoProduccion(dto.getCostoProduccion());
        p.setTiempoPreparacionEst(dto.getTiempoPreparacionEst());

        if (dto.getProveedorId() != null) {
            Proveedor prov = proveedorRepository.findById(dto.getProveedorId()).orElse(null);
            p.setProveedor(prov);
        } else {
            p.setProveedor(null);
        }
    }

    private Map<String, String> mapError(String msg) {
        Map<String, String> err = new HashMap<>();
        err.put("detail", msg);
        return err;
    }
}
