import bcrypt
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Usuario
from backend.schemas import UsuarioLogin, UsuarioRegister, UsuarioOut

router = APIRouter(prefix="/auth", tags=["auth"])

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False
    # If it is a bcrypt hash (starts with $2a$ or $2b$)
    if hashed_password.startswith("$2a$") or hashed_password.startswith("$2b$"):
        try:
            # Python's bcrypt expects bytes. Ensure it's compatible by converting prefix if necessary
            # bcrypt python library handles $2a$ and $2b$ automatically
            return bcrypt.checkpw(
                plain_password.encode("utf-8"), 
                hashed_password.encode("utf-8")
            )
        except Exception:
            return plain_password == hashed_password
    else:
        # Fallback to plaintext comparison (for seed scripts)
        return plain_password == hashed_password

def get_password_hash(password: str) -> str:
    # Hash password using bcrypt and return as UTF-8 string
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

@router.post("/register", response_model=UsuarioOut)
def register(dto: UsuarioRegister, db: Session = Depends(get_db)):
    # Check if username or email already exists
    existing = db.query(Usuario).filter(
        (Usuario.username == dto.username) | (Usuario.email == dto.email)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario o email ya está registrado"
        )
    
    # Create new user
    user = Usuario(
        nombre=dto.nombre,
        username=dto.username,
        email=dto.email,
        password_hash=get_password_hash(dto.password),
        rol_sistema="empleado", # default system role
        estado_activos=True,
        fecha_creacion=datetime.now()
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)

    return user

@router.post("/login", response_model=UsuarioOut)
def login(dto: UsuarioLogin, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.username == dto.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos"
        )
    
    if not user.estado_activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario inactivo"
        )
    
    if not verify_password(dto.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos"
        )
    
    user.ultimo_login = datetime.now()
    db.commit()
    db.refresh(user)

    return user
