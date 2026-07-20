package com.los_patos.restaurant.controller;

import com.los_patos.restaurant.model.*;
import com.los_patos.restaurant.repository.*;
import com.los_patos.restaurant.service.PdfGeneratorService;
import com.los_patos.restaurant.service.EmailService;
import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/ventas")
public class VentaController {

    @Autowired
    private VentaEncabezadoRepository ventaEncabezadoRepository;

    @Autowired
    private VentaDetalleRepository ventaDetalleRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private EmpleadoRepository empleadoRepository;

    @Autowired
    private MesaRepository mesaRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private PdfGeneratorService pdfGeneratorService;

    @Autowired
    private EmailService emailService;

    @Value("${app.webhook.n8n:}")
    private String n8nWebhookUrl;

    @Data
    public static class VentaDetalleCreateDto {
        private Integer productoId;
        private Integer cantidad;
        private BigDecimal precioUnitarioMomento;
        private String tiempoPreparacionReal;
        private String estadoCocina;
    }

    @Data
    public static class VentaCreateDto {
        private Integer clienteId;
        private Integer empleadoId;
        private Integer mesaId;
        private BigDecimal subtotal;
        private BigDecimal impuestos;
        private BigDecimal propina;
        private BigDecimal descuentoAplicado;
        private BigDecimal totalFinal;
        private List<VentaDetalleCreateDto> detalles = new ArrayList<>();
    }

    @Data
    public static class DetalleCocinaUpdateDto {
        private String estado_cocina; // Formato exacto de FastAPI schemas.py
    }

    @GetMapping("/")
    public ResponseEntity<List<VentaEncabezado>> getVentas() {
        return ResponseEntity.ok(ventaEncabezadoRepository.findAll());
    }

    @PostMapping("/")
    public ResponseEntity<VentaEncabezado> createVenta(@RequestBody VentaCreateDto dto) {
        VentaEncabezado venta = new VentaEncabezado();
        venta.setFechaHora(LocalDateTime.now());

        if (dto.getClienteId() != null) {
            venta.setCliente(clienteRepository.findById(dto.getClienteId()).orElse(null));
        }
        if (dto.getEmpleadoId() != null) {
            venta.setEmpleado(empleadoRepository.findById(dto.getEmpleadoId()).orElse(null));
        }
        if (dto.getMesaId() != null) {
            venta.setMesa(mesaRepository.findById(dto.getMesaId()).orElse(null));
        }

        venta.setSubtotal(dto.getSubtotal());
        venta.setImpuestos(dto.getImpuestos());
        venta.setPropina(dto.getPropina());
        venta.setDescuentoAplicado(dto.getDescuentoAplicado());
        venta.setTotalFinal(dto.getTotalFinal());

        // Guardar primero para tener la venta ID
        VentaEncabezado savedVenta = ventaEncabezadoRepository.save(venta);

        for (VentaDetalleCreateDto detDto : dto.getDetalles()) {
            VentaDetalle det = new VentaDetalle();
            det.setVenta(savedVenta);

            Producto p = null;
            if (detDto.getProductoId() != null) {
                p = productoRepository.findById(detDto.getProductoId()).orElse(null);
                det.setProducto(p);
            }

            det.setCantidad(detDto.getCantidad());

            if (detDto.getPrecioUnitarioMomento() != null) {
                det.setPrecioUnitarioMomento(detDto.getPrecioUnitarioMomento());
            } else if (p != null) {
                det.setPrecioUnitarioMomento(p.getPrecioVenta());
            } else {
                det.setPrecioUnitarioMomento(BigDecimal.ZERO);
            }

            det.setTiempoPreparacionReal(detDto.getTiempoPreparacionReal());

            if (detDto.getEstadoCocina() != null) {
                try {
                    det.setEstadoCocina(EstadoCocina.valueOf(detDto.getEstadoCocina().toLowerCase()));
                } catch (Exception e) {
                    det.setEstadoCocina(EstadoCocina.pendiente);
                }
            } else {
                det.setEstadoCocina(EstadoCocina.pendiente);
            }

            ventaDetalleRepository.save(det);
            savedVenta.getDetalles().add(det);
        }

        // Enviar comprobante al cliente por correo electrónico si está registrado y tiene correo
        if (savedVenta.getCliente() != null && savedVenta.getCliente().getEmail() != null && !savedVenta.getCliente().getEmail().trim().isEmpty()) {
            try {
                String email = savedVenta.getCliente().getEmail();
                String name = savedVenta.getCliente().getNombre();
                String docType = "Ticket";
                boolean isFactura = "empresarial".equalsIgnoreCase(savedVenta.getCliente().getSegmento()) 
                        || "corporativo".equalsIgnoreCase(savedVenta.getCliente().getSegmento());
                if (isFactura) {
                    docType = "Factura";
                }
                
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                if (isFactura) {
                    pdfGeneratorService.generateFactura(savedVenta, baos);
                } else {
                    pdfGeneratorService.generateTicket(savedVenta, baos);
                }
                
                byte[] pdfBytes = baos.toByteArray();
                String filename = docType.toLowerCase() + "_" + savedVenta.getVentaId() + ".pdf";
                
                emailService.sendInvoiceEmail(email, name, docType, pdfBytes, filename);
            } catch (Exception e) {
                System.err.println("Error al generar o enviar el comprobante por correo: " + e.getMessage());
            }
        }

        triggerWebhook(savedVenta);

        return ResponseEntity.status(HttpStatus.CREATED).body(savedVenta);
    }

    @GetMapping("/historial")
    public ResponseEntity<List<Map<String, Object>>> getHistorialVentas() {
        List<VentaEncabezado> ventas = ventaEncabezadoRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        // Ordenar por fecha descendente
        ventas.sort((v1, v2) -> {
            if (v1.getFechaHora() == null && v2.getFechaHora() == null) return 0;
            if (v1.getFechaHora() == null) return 1;
            if (v2.getFechaHora() == null) return -1;
            return v2.getFechaHora().compareTo(v1.getFechaHora());
        });

        for (VentaEncabezado v : ventas) {
            String clienteNombre = v.getCliente() != null ? v.getCliente().getNombre() : "Consumidor Final";
            String meseroNombre = v.getEmpleado() != null ? v.getEmpleado().getNombre() : "N/A";
            String mesaStr = v.getMesa() != null ? "Mesa " + v.getMesa().getNumeroMesa() : "Para Llevar";

            if (v.getDetalles() == null || v.getDetalles().isEmpty()) {
                Map<String, Object> row = new HashMap<>();
                row.put("venta_id", v.getVentaId());
                row.put("fecha_hora", v.getFechaHora() != null ? v.getFechaHora().toString() : null);
                row.put("cliente", clienteNombre);
                row.put("mesero", meseroNombre);
                row.put("mesa", mesaStr);
                row.put("producto", "Venta General (Sin Detalle)");
                row.put("cantidad", 1);
                row.put("precio_unitario", v.getSubtotal() != null ? v.getSubtotal() : (v.getTotalFinal() != null ? v.getTotalFinal() : BigDecimal.ZERO));
                row.put("subtotal_detalle", v.getSubtotal() != null ? v.getSubtotal() : (v.getTotalFinal() != null ? v.getTotalFinal() : BigDecimal.ZERO));
                row.put("tiempo_preparacion", "N/A");
                row.put("estado_cocina", "completado");
                row.put("subtotal_venta", v.getSubtotal() != null ? v.getSubtotal() : BigDecimal.ZERO);
                row.put("impuestos", v.getImpuestos() != null ? v.getImpuestos() : BigDecimal.ZERO);
                row.put("propina", v.getPropina() != null ? v.getPropina() : BigDecimal.ZERO);
                row.put("descuento", v.getDescuentoAplicado() != null ? v.getDescuentoAplicado() : BigDecimal.ZERO);
                row.put("total_final", v.getTotalFinal() != null ? v.getTotalFinal() : BigDecimal.ZERO);
                result.add(row);
            } else {
                for (VentaDetalle d : v.getDetalles()) {
                    Map<String, Object> row = new HashMap<>();
                    row.put("venta_id", v.getVentaId());
                    row.put("fecha_hora", v.getFechaHora() != null ? v.getFechaHora().toString() : null);
                    row.put("cliente", clienteNombre);
                    row.put("mesero", meseroNombre);
                    row.put("mesa", mesaStr);

                    String prodNombre = d.getProducto() != null ? d.getProducto().getNombre() : "Producto Eliminado";
                    BigDecimal precio = d.getPrecioUnitarioMomento() != null ? d.getPrecioUnitarioMomento() : BigDecimal.ZERO;
                    int cant = d.getCantidad() != null ? d.getCantidad() : 1;

                    row.put("producto", prodNombre);
                    row.put("cantidad", cant);
                    row.put("precio_unitario", precio);
                    row.put("subtotal_detalle", precio.multiply(BigDecimal.valueOf(cant)));
                    row.put("tiempo_preparacion", d.getTiempoPreparacionReal() != null ? d.getTiempoPreparacionReal() : "N/A");
                    row.put("estado_cocina", d.getEstadoCocina() != null ? d.getEstadoCocina().name() : "pendiente");
                    row.put("subtotal_venta", v.getSubtotal() != null ? v.getSubtotal() : BigDecimal.ZERO);
                    row.put("impuestos", v.getImpuestos() != null ? v.getImpuestos() : BigDecimal.ZERO);
                    row.put("propina", v.getPropina() != null ? v.getPropina() : BigDecimal.ZERO);
                    row.put("descuento", v.getDescuentoAplicado() != null ? v.getDescuentoAplicado() : BigDecimal.ZERO);
                    row.put("total_final", v.getTotalFinal() != null ? v.getTotalFinal() : BigDecimal.ZERO);
                    result.add(row);
                }
            }
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getVenta(@PathVariable("id") Integer id) {
        Optional<VentaEncabezado> opt = ventaEncabezadoRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapError("Venta no encontrada"));
        }
        return ResponseEntity.ok(opt.get());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteVenta(@PathVariable("id") Integer id) {
        Optional<VentaEncabezado> opt = ventaEncabezadoRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapError("Venta no encontrada"));
        }
        ventaEncabezadoRepository.delete(opt.get());
        Map<String, String> res = new HashMap<>();
        res.put("message", "Venta eliminada exitosamente");
        return ResponseEntity.ok(res);
    }

    @PutMapping("/detalle/{detalleId}/cocina")
    public ResponseEntity<?> updateEstadoCocina(@PathVariable("detalleId") Integer detalleId, @RequestBody DetalleCocinaUpdateDto dto) {
        Optional<VentaDetalle> opt = ventaDetalleRepository.findById(detalleId);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapError("Detalle no encontrado"));
        }
        VentaDetalle det = opt.get();
        try {
            det.setEstadoCocina(EstadoCocina.valueOf(dto.getEstado_cocina().toLowerCase()));
            ventaDetalleRepository.save(det);
            Map<String, Object> res = new HashMap<>();
            res.put("message", "Estado de cocina actualizado");
            res.put("estado_cocina", det.getEstadoCocina().name());
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(mapError("Estado de cocina inválido"));
        }
    }

    @GetMapping("/{id}/ticket")
    public ResponseEntity<byte[]> downloadTicket(@PathVariable("id") Integer id) {
        Optional<VentaEncabezado> opt = ventaEncabezadoRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        pdfGeneratorService.generateTicket(opt.get(), baos);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment().filename("ticket_" + id + ".pdf").build());
        return ResponseEntity.ok().headers(headers).body(baos.toByteArray());
    }

    @GetMapping("/{id}/factura")
    public ResponseEntity<byte[]> downloadFactura(@PathVariable("id") Integer id) {
        Optional<VentaEncabezado> opt = ventaEncabezadoRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        pdfGeneratorService.generateFactura(opt.get(), baos);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment().filename("factura_" + id + ".pdf").build());
        return ResponseEntity.ok().headers(headers).body(baos.toByteArray());
    }

    private Map<String, String> mapError(String msg) {
        Map<String, String> err = new HashMap<>();
        err.put("detail", msg);
        return err;
    }

    private void triggerWebhook(VentaEncabezado venta) {
        if (n8nWebhookUrl == null || n8nWebhookUrl.trim().isEmpty()) {
            return;
        }
        
        java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
        try {
            StringBuilder json = new StringBuilder();
            json.append("{");
            json.append("\"ventaId\":").append(venta.getVentaId()).append(",");
            json.append("\"clienteNombre\":\"").append(escapeJson(venta.getCliente() != null ? venta.getCliente().getNombre() : "Consumidor Final")).append("\",");
            json.append("\"mesa\":\"").append(escapeJson(venta.getMesa() != null ? "Mesa " + venta.getMesa().getNumeroMesa() : "Para Llevar")).append("\",");
            json.append("\"totalFinal\":").append(venta.getTotalFinal()).append(",");
            json.append("\"detalles\":[");
            if (venta.getDetalles() != null) {
                for (int i = 0; i < venta.getDetalles().size(); i++) {
                    VentaDetalle d = venta.getDetalles().get(i);
                    json.append("{");
                    json.append("\"productoNombre\":\"").append(escapeJson(d.getProducto() != null ? d.getProducto().getNombre() : "Producto")).append("\",");
                    json.append("\"cantidad\":").append(d.getCantidad()).append(",");
                    json.append("\"precioUnitario\":").append(d.getPrecioUnitarioMomento() != null ? d.getPrecioUnitarioMomento() : 0);
                    json.append("}");
                    if (i < venta.getDetalles().size() - 1) {
                        json.append(",");
                    }
                }
            }
            json.append("]");
            json.append("}");

            java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create(n8nWebhookUrl))
                    .header("Content-Type", "application/json")
                    .POST(java.net.http.HttpRequest.BodyPublishers.ofString(json.toString()))
                    .build();
            
            client.sendAsync(request, java.net.http.HttpResponse.BodyHandlers.ofString())
                    .thenAccept(response -> {
                        System.out.println("Webhook enviado a n8n. Código de respuesta: " + response.statusCode());
                    })
                    .exceptionally(ex -> {
                        System.err.println("Error al enviar webhook a n8n: " + ex.getMessage());
                        return null;
                    });
        } catch (Exception e) {
            System.err.println("Error al construir payload de webhook: " + e.getMessage());
        }
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }
}
