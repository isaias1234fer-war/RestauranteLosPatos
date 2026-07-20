import os
from datetime import datetime

def send_sale_email(to_email: str, client_name: str, total_amount: float, details_html: str):
    """
    Simulates sending an email by writing it as a file under the 'sent_emails' directory,
    replicating the local Spring Boot email service behavior.
    """
    os.makedirs("sent_emails", exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_path = f"sent_emails/email_venta_{timestamp}.html"
    
    html_content = f"""
    <html>
    <head><title>Comprobante de Venta - Los Patos</title></head>
    <body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #4f46e5;">Restaurante Los Patos - Detalle de Consumo</h2>
        <p>Estimado/a <strong>{client_name}</strong>,</p>
        <p>Agradecemos su preferencia. Adjuntamos el detalle de su consumo en nuestro local:</p>
        <hr/>
        {details_html}
        <hr/>
        <h3 style="color: #10b981;">Total Consumido: ${total_amount:.2f}</h3>
        <p>Esperamos verle pronto de nuevo.</p>
        <br/>
        <p><em>Los Patos Team.</em></p>
    </body>
    </html>
    """
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"Email simulado guardado en: {file_path}")
