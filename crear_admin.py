from backend.database import SessionLocal
from backend.models import Usuario

def create_admin():
    db = SessionLocal()
    
    admin_exists = db.query(Usuario).filter(Usuario.username == "admin").first()
    if not admin_exists:
        admin_user = Usuario(
            username="admin",
            email="admin@lospatos.com",
            password_hash="admin123", # Contraseña plana como solicitaste
            rol_sistema="administrador"
        )
        db.add(admin_user)
        db.commit()
        print("Usuario administrador creado con éxito: admin / admin123")
    else:
        print("El usuario administrador ya existe.")
        
    empleado_exists = db.query(Usuario).filter(Usuario.username == "empleado").first()
    if not empleado_exists:
        emp_user = Usuario(
            username="empleado",
            email="empleado@lospatos.com",
            password_hash="emp123", # Contraseña plana como solicitaste
            rol_sistema="empleado"
        )
        db.add(emp_user)
        db.commit()
        print("Usuario empleado creado con éxito: empleado / emp123")
    else:
        print("El usuario empleado ya existe.")
        
    db.close()

if __name__ == "__main__":
    create_admin()
