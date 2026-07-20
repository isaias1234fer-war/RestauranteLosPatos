package com.los_patos.restaurant.service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public boolean sendInvoiceEmail(String toEmail, String clientName, String documentType, byte[] pdfBytes, String filename) {
        if (toEmail == null || toEmail.trim().isEmpty()) {
            System.out.println("No se especificó correo para el cliente. Saltando envío.");
            saveEmailLocally(toEmail, clientName, documentType, pdfBytes, filename);
            return false;
        }

        try {
            if (mailSender != null) {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

                helper.setTo(toEmail);
                helper.setSubject("Tu " + documentType + " de Restaurant Los Patos");
                
                String body = "Hola " + clientName + ",\n\n"
                        + "Muchas gracias por tu compra en Restaurant Los Patos. Adjunto a este correo encontrarás tu "
                        + documentType.toLowerCase() + " en formato PDF.\n\n"
                        + "¡Esperamos verte pronto de nuevo!\n\n"
                        + "Saludos cordiales,\n"
                        + "El equipo de Los Patos.";
                
                helper.setText(body);
                helper.addAttachment(filename, new ByteArrayResource(pdfBytes));

                mailSender.send(message);
                System.out.println("Correo enviado con éxito a: " + toEmail);
                return true;
            } else {
                System.out.println("JavaMailSender no está configurado. Guardando copia local del correo.");
                saveEmailLocally(toEmail, clientName, documentType, pdfBytes, filename);
                return false;
            }
        } catch (Exception e) {
            System.err.println("Error al enviar correo: " + e.getMessage());
            e.printStackTrace();
            saveEmailLocally(toEmail, clientName, documentType, pdfBytes, filename);
            return false;
        }
    }

    private void saveEmailLocally(String toEmail, String clientName, String documentType, byte[] pdfBytes, String filename) {
        try {
            String dirPath = "sent_emails";
            Files.createDirectories(Paths.get(dirPath));
            
            String safeEmail = (toEmail != null && !toEmail.isEmpty()) ? toEmail : "sin_correo";
            String baseName = dirPath + "/" + safeEmail + "_" + documentType.replace(" ", "_") + "_" + System.currentTimeMillis();
            
            // Guardar info del correo
            String info = "Para: " + safeEmail + "\n"
                    + "Cliente: " + clientName + "\n"
                    + "Tipo Documento: " + documentType + "\n"
                    + "Fecha de Envío Simulada: " + java.time.LocalDateTime.now() + "\n";
            Files.writeString(Paths.get(baseName + ".txt"), info);
            
            // Guardar PDF
            try (FileOutputStream fos = new FileOutputStream(new File(baseName + "_" + filename))) {
                fos.write(pdfBytes);
            }
            System.out.println("Copia del correo guardada en: " + baseName + ".txt y PDF adjunto.");
        } catch (IOException e) {
            System.err.println("No se pudo guardar la copia local del correo: " + e.getMessage());
        }
    }
}
