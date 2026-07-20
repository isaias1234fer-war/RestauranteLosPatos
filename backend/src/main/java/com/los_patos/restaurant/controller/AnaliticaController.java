package com.los_patos.restaurant.controller;

import com.los_patos.restaurant.service.AnaliticaService;
import com.los_patos.restaurant.service.PdfGeneratorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.util.Map;

@RestController
@RequestMapping("/api/analitica")
public class AnaliticaController {

    @Autowired
    private AnaliticaService analiticaService;

    @Autowired
    private PdfGeneratorService pdfGeneratorService;

    @PostMapping("/sync")
    public ResponseEntity<?> syncData() {
        try {
            Map<String, String> result = analiticaService.syncData();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("detail", e.getMessage()));
        }
    }

    @GetMapping("/filtros")
    public ResponseEntity<Map<String, Object>> getFiltros() {
        return ResponseEntity.ok(analiticaService.getFiltros());
    }

    @GetMapping("/kpis")
    public ResponseEntity<Map<String, Object>> getKpis(
            @RequestParam(value = "year", required = false) Integer year,
            @RequestParam(value = "month", required = false) String month) {
        return ResponseEntity.ok(analiticaService.getKpis(year, month));
    }

    @GetMapping("/reporte_pdf")
    public ResponseEntity<byte[]> downloadReportePdf(
            @RequestParam(value = "year", required = false) Integer year,
            @RequestParam(value = "month", required = false) String month) {
        Map<String, Object> kpis = analiticaService.getKpis(year, month);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        pdfGeneratorService.generateReportePdf(kpis, year, month, baos);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment().filename("reporte_analitica.pdf").build());
        return ResponseEntity.ok().headers(headers).body(baos.toByteArray());
    }
}
