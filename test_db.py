from backend.database import engine, SessionLocal
from backend.models import Producto
import sys
import io

# Set stdout to use UTF-8 to avoid encoding errors
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

try:
    # Test database connection
    db = SessionLocal()
    print("[OK] Database connection successful!")
    
    # Check for products
    products = db.query(Producto).all()
    print(f"[INFO] Found {len(products)} products in database!")
    if products:
        for p in products:
            print(f"  - {p.nombre} (${p.precio_venta})")
    else:
        print("[WARNING] No products found! Add some products first!")
        
    db.close()
except Exception as e:
    print(f"[ERROR] Database error: {type(e).__name__} - {str(e)}")
    import traceback
    traceback.print_exc()
