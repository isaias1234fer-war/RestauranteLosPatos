package com.los_patos.restaurant.service;

import com.los_patos.restaurant.model.VentaDetalle;
import com.lowagie.text.Document;
import com.lowagie.text.Rectangle;
import com.lowagie.text.PageSize;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfWriter;
import com.lowagie.text.Image;
import com.los_patos.restaurant.model.VentaEncabezado;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.File;
import java.io.OutputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
public class PdfGeneratorService {

    private Image getLogoImage() {
        try {
            // Buscar en varias rutas comunes
            String[] paths = {"img/logo.JPG", "../img/logo.JPG", "backend/logo.png", "logo.png"};
            for (String p : paths) {
                File file = new File(p);
                if (file.exists()) {
                    return Image.getInstance(file.getAbsolutePath());
                }
            }
        } catch (Exception e) {
            System.err.println("No se pudo cargar la imagen del logo: " + e.getMessage());
        }
        return null;
    }

    public void generateTicket(VentaEncabezado venta, OutputStream os) {
        // Ancho ticket: 80mm (~226 pt), alto: 800 pt (suficiente)
        Rectangle pageSize = new Rectangle(226, 800);
        Document document = new Document(pageSize, 10, 10, 10, 10);
        try {
            PdfWriter writer = PdfWriter.getInstance(document, os);
            document.open();
            PdfContentByte cb = writer.getDirectContent();
            BaseFont bfBold = BaseFont.createFont(BaseFont.HELVETICA_BOLD, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
            BaseFont bfNorm = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);

            float y = 780;
            float width = 226;

            // Logo
            Image img = getLogoImage();
            if (img != null) {
                img.scaleToFit(50, 50);
                img.setAbsolutePosition(10, y - 40);
                cb.addImage(img);
            }

            cb.beginText();
            cb.setFontAndSize(bfBold, 12);
            cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "LOS PATOS", 70, y - 20, 0);
            cb.setFontAndSize(bfNorm, 9);
            cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "Ticket de Venta", 70, y - 32, 0);
            cb.endText();

            y -= 55;
            cb.beginText();
            cb.setFontAndSize(bfNorm, 8);
            cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "Ticket Nro: " + venta.getVentaId(), 10, y, 0);
            y -= 12;
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/m/yyyy HH:mm");
            String fechaStr = venta.getFechaHora() != null ? venta.getFechaHora().format(formatter) : LocalDateTime.now().format(formatter);
            cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "Fecha: " + fechaStr, 10, y, 0);
            y -= 12;
            String mesaStr = venta.getMesa() != null ? String.valueOf(venta.getMesa().getNumeroMesa()) : "Llevar";
            String meseroStr = venta.getEmpleado() != null ? venta.getEmpleado().getNombre() : "N/A";
            cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "Mesa: " + mesaStr, 10, y, 0);
            cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "Mesero: " + meseroStr, 110, y, 0);
            cb.endText();

            y -= 15;
            cb.setLineWidth(0.5f);
            cb.moveTo(10, y); cb.lineTo(width - 10, y); cb.stroke();

            y -= 12;
            cb.beginText();
            cb.setFontAndSize(bfBold, 8);
            cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "CANT", 10, y, 0);
            cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "DESCRIPCION", 40, y, 0);
            cb.showTextAligned(PdfContentByte.ALIGN_RIGHT, "TOTAL", width - 10, y, 0);
            cb.endText();

            y -= 8;
            cb.moveTo(10, y); cb.lineTo(width - 10, y); cb.stroke();

            y -= 12;
            cb.beginText();
            cb.setFontAndSize(bfNorm, 8);
            for (VentaDetalle det : venta.getDetalles()) {
                String prodNombre = det.getProducto() != null ? det.getProducto().getNombre() : "Producto";
                if (prodNombre.length() > 15) prodNombre = prodNombre.substring(0, 15);
                BigDecimal precio = det.getPrecioUnitarioMomento() != null ? det.getPrecioUnitarioMomento() : BigDecimal.ZERO;
                BigDecimal totalLine = precio.multiply(BigDecimal.valueOf(det.getCantidad()));

                cb.showTextAligned(PdfContentByte.ALIGN_LEFT, String.valueOf(det.getCantidad()), 15, y, 0);
                cb.showTextAligned(PdfContentByte.ALIGN_LEFT, prodNombre, 40, y, 0);
                cb.showTextAligned(PdfContentByte.ALIGN_RIGHT, "$" + String.format("%.2f", totalLine), width - 10, y, 0);
                y -= 12;
            }
            cb.endText();

            y -= 2;
            cb.moveTo(10, y); cb.lineTo(width - 10, y); cb.stroke();

            y -= 12;
            cb.beginText();
            cb.setFontAndSize(bfNorm, 8);
            cb.showTextAligned(PdfContentByte.ALIGN_RIGHT, "Subtotal:", width - 50, y, 0);
            cb.showTextAligned(PdfContentByte.ALIGN_RIGHT, "$" + String.format("%.2f", venta.getSubtotal() != null ? venta.getSubtotal() : BigDecimal.ZERO), width - 10, y, 0);
            y -= 12;
            cb.showTextAligned(PdfContentByte.ALIGN_RIGHT, "Impuestos:", width - 50, y, 0);
            cb.showTextAligned(PdfContentByte.ALIGN_RIGHT, "$" + String.format("%.2f", venta.getImpuestos() != null ? venta.getImpuestos() : BigDecimal.ZERO), width - 10, y, 0);

            if (venta.getDescuentoAplicado() != null && venta.getDescuentoAplicado().compareTo(BigDecimal.ZERO) > 0) {
                y -= 12;
                cb.showTextAligned(PdfContentByte.ALIGN_RIGHT, "Descuento:", width - 50, y, 0);
                cb.showTextAligned(PdfContentByte.ALIGN_RIGHT, "-$" + String.format("%.2f", venta.getDescuentoAplicado()), width - 10, y, 0);
            }
            if (venta.getPropina() != null && venta.getPropina().compareTo(BigDecimal.ZERO) > 0) {
                y -= 12;
                cb.showTextAligned(PdfContentByte.ALIGN_RIGHT, "Propina:", width - 50, y, 0);
                cb.showTextAligned(PdfContentByte.ALIGN_RIGHT, "$" + String.format("%.2f", venta.getPropina()), width - 10, y, 0);
            }

            y -= 16;
            cb.setFontAndSize(bfBold, 10);
            cb.showTextAligned(PdfContentByte.ALIGN_RIGHT, "TOTAL:", width - 50, y, 0);
            cb.showTextAligned(PdfContentByte.ALIGN_RIGHT, "$" + String.format("%.2f", venta.getTotalFinal() != null ? venta.getTotalFinal() : BigDecimal.ZERO), width - 10, y, 0);

            y -= 25;
            cb.setFontAndSize(bfNorm, 8);
            cb.showTextAligned(PdfContentByte.ALIGN_CENTER, "¡Gracias por su compra!", width / 2f, y, 0);
            cb.endText();

        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            document.close();
        }
    }

    public void generateFactura(VentaEncabezado venta, OutputStream os) {
        Document document = new Document(PageSize.A4, 40, 40, 40, 40);
        try {
            PdfWriter writer = PdfWriter.getInstance(document, os);
            document.open();
            PdfContentByte cb = writer.getDirectContent();
            BaseFont bfBold = BaseFont.createFont(BaseFont.HELVETICA_BOLD, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
            BaseFont bfNorm = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);

            float width = PageSize.A4.getWidth();
            float height = PageSize.A4.getHeight();
            float y = height - 40;

            // Logo
            Image img = getLogoImage();
            if (img != null) {
                img.scaleToFit(80, 80);
                img.setAbsolutePosition(40, y - 60);
                cb.addImage(img);
            }

            cb.beginText();
            cb.setFontAndSize(bfBold, 14);
            cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "RESTAURANTE LOS PATOS S.A.C.", 130, y - 20, 0);
            cb.setFontAndSize(bfNorm, 9);
            cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "Av. Los Patos 123, Distrito Central, Lima - Perú", 130, y - 35, 0);
            cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "Teléfono: (01) 555-1234", 130, y - 48, 0);
            cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "Email: contacto@lospatos.pe", 130, y - 61, 0);
            cb.endText();

            // Recuadro SUNAT (Derecha)
            cb.setColorStroke(Color.BLACK);
            cb.setLineWidth(1.5f);
            cb.roundRectangle(width - 240, y - 70, 200, 80, 5);
            cb.stroke();

            cb.beginText();
            cb.setFontAndSize(bfBold, 12);
            cb.showTextAligned(PdfContentByte.ALIGN_CENTER, "RUC: 20123456789", width - 140, y - 15, 0);
            cb.showTextAligned(PdfContentByte.ALIGN_CENTER, "FACTURA ELECTRÓNICA", width - 140, y - 35, 0);
            cb.setFontAndSize(bfNorm, 12);
            String docNum = String.format("F001-%06d", venta.getVentaId());
            cb.showTextAligned(PdfContentByte.ALIGN_CENTER, docNum, width - 140, y - 55, 0);
            cb.endText();

            // Datos del cliente
            y -= 100;
            cb.setLineWidth(0.5f);
            cb.rectangle(40, y - 60, width - 80, 50);
            cb.stroke();

            cb.beginText();
            cb.setFontAndSize(bfBold, 9);
            cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "Señor(es):", 50, y - 25, 0);
            cb.setFontAndSize(bfNorm, 9);
            String cName = venta.getCliente() != null ? venta.getCliente().getNombre() : "CLIENTE GENÉRICO";
            cb.showTextAligned(PdfContentByte.ALIGN_LEFT, cName, 110, y - 25, 0);

            cb.setFontAndSize(bfBold, 9);
            cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "DNI/RUC:", 50, y - 40, 0);
            cb.setFontAndSize(bfNorm, 9);
            cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "00000000", 110, y - 40, 0);

            cb.setFontAndSize(bfBold, 9);
            cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "Fecha Emisión:", width - 220, y - 25, 0);
            cb.setFontAndSize(bfNorm, 9);
            DateTimeFormatter emFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            String emFecha = venta.getFechaHora() != null ? venta.getFechaHora().format(emFormatter) : LocalDateTime.now().format(emFormatter);
            cb.showTextAligned(PdfContentByte.ALIGN_LEFT, emFecha, width - 140, y - 25, 0);

            cb.setFontAndSize(bfBold, 9);
            cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "Moneda:", width - 220, y - 40, 0);
            cb.setFontAndSize(bfNorm, 9);
            cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "SOLES", width - 140, y - 40, 0);
            cb.endText();

            // Tabla Detalles
            y -= 80;
            cb.setColorFill(new Color(230, 230, 230));
            cb.rectangle(40, y, width - 80, 20);
            cb.fill();

            cb.setColorFill(Color.BLACK);
            cb.beginText();
            cb.setFontAndSize(bfBold, 9);
            cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "CANT.", 50, y + 6, 0);
            cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "DESCRIPCIÓN", 100, y + 6, 0);
            cb.showTextAligned(PdfContentByte.ALIGN_RIGHT, "P. UNIT", width - 120, y + 6, 0);
            cb.showTextAligned(PdfContentByte.ALIGN_RIGHT, "IMPORTE", width - 50, y + 6, 0);
            cb.endText();

            y -= 20;
            cb.beginText();
            cb.setFontAndSize(bfNorm, 9);
            for (VentaDetalle det : venta.getDetalles()) {
                String prodNombre = det.getProducto() != null ? det.getProducto().getNombre() : "Producto";
                if (prodNombre.length() > 45) prodNombre = prodNombre.substring(0, 45);
                BigDecimal precio = det.getPrecioUnitarioMomento() != null ? det.getPrecioUnitarioMomento() : BigDecimal.ZERO;
                BigDecimal totalLine = precio.multiply(BigDecimal.valueOf(det.getCantidad()));

                cb.showTextAligned(PdfContentByte.ALIGN_LEFT, String.valueOf(det.getCantidad()), 55, y + 6, 0);
                cb.showTextAligned(PdfContentByte.ALIGN_LEFT, prodNombre, 100, y + 6, 0);
                cb.showTextAligned(PdfContentByte.ALIGN_RIGHT, String.format("%.2f", precio), width - 120, y + 6, 0);
                cb.showTextAligned(PdfContentByte.ALIGN_RIGHT, String.format("%.2f", totalLine), width - 50, y + 6, 0);
                y -= 15;
            }
            cb.endText();

            y += 5;
            cb.moveTo(40, y); cb.lineTo(width - 40, y); cb.stroke();

            y -= 15;
            cb.beginText();
            cb.setFontAndSize(bfNorm, 9);
            cb.showTextAligned(PdfContentByte.ALIGN_RIGHT, "Subtotal:", width - 120, y, 0);
            cb.showTextAligned(PdfContentByte.ALIGN_RIGHT, String.format("%.2f", venta.getSubtotal() != null ? venta.getSubtotal() : BigDecimal.ZERO), width - 50, y, 0);
            y -= 15;
            cb.showTextAligned(PdfContentByte.ALIGN_RIGHT, "Impuestos (18%):", width - 120, y, 0);
            cb.showTextAligned(PdfContentByte.ALIGN_RIGHT, String.format("%.2f", venta.getImpuestos() != null ? venta.getImpuestos() : BigDecimal.ZERO), width - 50, y, 0);
            y -= 15;
            cb.setFontAndSize(bfBold, 10);
            cb.showTextAligned(PdfContentByte.ALIGN_RIGHT, "TOTAL GENERAL:", width - 120, y, 0);
            cb.showTextAligned(PdfContentByte.ALIGN_RIGHT, String.format("%.2f", venta.getTotalFinal() != null ? venta.getTotalFinal() : BigDecimal.ZERO), width - 50, y, 0);
            cb.endText();

        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            document.close();
        }
    }

    public void generateReportePdf(Map<String, Object> kpis, Integer year, String month, OutputStream os) {
        Document document = new Document(PageSize.A4, 40, 40, 40, 40);
        try {
            PdfWriter writer = PdfWriter.getInstance(document, os);
            document.open();
            PdfContentByte cb = writer.getDirectContent();
            BaseFont bfBold = BaseFont.createFont(BaseFont.HELVETICA_BOLD, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
            BaseFont bfNorm = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);

            float width = PageSize.A4.getWidth();
            float height = PageSize.A4.getHeight();
            float y = height - 40;

            // Titulo y Logo
            Image img = getLogoImage();
            if (img != null) {
                img.scaleToFit(80, 80);
                img.setAbsolutePosition(40, y - 60);
                cb.addImage(img);
            }

            cb.beginText();
            cb.setFontAndSize(bfBold, 20);
            cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "Reporte Analítico - Los Patos", 140, y - 25, 0);
            cb.setFontAndSize(bfNorm, 11);
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "Generado el: " + LocalDateTime.now().format(formatter), 140, y - 45, 0);
            if (year != null || month != null) {
                String filterText = "Filtro aplicado: " + (year != null ? year : "") + (month != null ? " - " + month : "");
                cb.showTextAligned(PdfContentByte.ALIGN_LEFT, filterText, 140, y - 58, 0);
            }
            cb.endText();

            y -= 80;
            cb.setLineWidth(1.0f);
            cb.moveTo(40, y); cb.lineTo(width - 40, y); cb.stroke();

            // KPIs
            y -= 30;
            cb.beginText();
            cb.setFontAndSize(bfBold, 12);
            BigDecimal totalIngresos = (BigDecimal) kpis.get("total_ingresos");
            cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "Total Ingresos: $" + String.format("%.2f", totalIngresos != null ? totalIngresos : BigDecimal.ZERO), 40, y, 0);
            cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "Platos Vendidos: " + kpis.get("total_platos"), 300, y, 0);
            cb.endText();

            // Dibujar Gráficos Vectoriales
            // Gráfico 1: Ventas por Categoría (Barras Horizontales)
            y -= 40;
            cb.beginText();
            cb.setFontAndSize(bfBold, 12);
            cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "Ventas por Categoría", 40, y, 0);
            cb.endText();

            y -= 20;
            List<Map<String, Object>> catData = (List<Map<String, Object>>) kpis.get("ventas_por_categoria");
            y = drawVectorChart(cb, catData, "categoria", y, bfNorm);

            // Gráfico 2: Ventas por Empleado (Barras Horizontales)
            y -= 30;
            cb.beginText();
            cb.setFontAndSize(bfBold, 12);
            cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "Ventas por Empleado", 40, y, 0);
            cb.endText();

            y -= 20;
            List<Map<String, Object>> empData = (List<Map<String, Object>>) kpis.get("ventas_por_empleado");
            y = drawVectorChart(cb, empData, "empleado", y, bfNorm);

            // Salto de página para Ventas por Producto
            document.newPage();
            y = height - 60;

            cb.beginText();
            cb.setFontAndSize(bfBold, 12);
            cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "Ventas por Producto", 40, y, 0);
            cb.endText();

            y -= 20;
            List<Map<String, Object>> prodData = (List<Map<String, Object>>) kpis.get("ventas_por_producto");
            y = drawVectorChart(cb, prodData, "producto", y, bfNorm);

        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            document.close();
        }
    }

    private float drawVectorChart(PdfContentByte cb, List<Map<String, Object>> data, String labelKey, float startY, BaseFont bfNorm) {
        if (data == null || data.isEmpty()) {
            cb.beginText();
            cb.setFontAndSize(bfNorm, 9);
            cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "Sin datos disponibles.", 50, startY, 0);
            cb.endText();
            return startY - 20;
        }

        // Buscar el valor máximo para escalar las barras
        BigDecimal maxVal = BigDecimal.ZERO;
        for (Map<String, Object> item : data) {
            BigDecimal val = (BigDecimal) item.get("total");
            if (val != null && val.compareTo(maxVal) > 0) {
                maxVal = val;
            }
        }
        if (maxVal.compareTo(BigDecimal.ZERO) == 0) maxVal = BigDecimal.ONE;

        float y = startY;
        float chartWidth = 350f; // Ancho máximo de la barra

        Color[] colors = {
            new Color(31, 119, 180),  // Azul
            new Color(255, 127, 14),  // Naranja
            new Color(44, 160, 44),   // Verde
            new Color(214, 39, 40),   // Rojo
            new Color(148, 103, 189), // Morado
            new Color(140, 86, 75)    // Marrón
        };
        int colorIdx = 0;

        for (Map<String, Object> item : data) {
            String label = (String) item.get(labelKey);
            BigDecimal val = (BigDecimal) item.get("total");
            if (val == null) val = BigDecimal.ZERO;

            if (label == null) label = "N/A";
            if (label.length() > 20) label = label.substring(0, 20);

            // Dibujar etiqueta
            cb.beginText();
            cb.setFontAndSize(bfNorm, 9);
            cb.showTextAligned(PdfContentByte.ALIGN_LEFT, label, 40, y + 3, 0);
            cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "$" + String.format("%.2f", val), 180, y + 3, 0);
            cb.endText();

            // Dibujar barra
            float barW = (val.floatValue() / maxVal.floatValue()) * chartWidth;
            if (barW < 2f) barW = 2f; // Ancho mínimo visible

            cb.setColorFill(colors[colorIdx % colors.length]);
            cb.rectangle(230, y, barW, 10);
            cb.fill();
            colorIdx++;

            y -= 18;

            // Evitar pasarse del final de página
            if (y < 50) break;
        }

        cb.setColorFill(Color.BLACK); // Restaurar
        return y - 10;
    }
}
