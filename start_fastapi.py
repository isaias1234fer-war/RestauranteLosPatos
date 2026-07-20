import sys
import io

# Set encoding to UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

import uvicorn

if __name__ == "__main__":
    try:
        print("[INFO] Starting Uvicorn server on 127.0.0.1:8002...")
        uvicorn.run(
            "backend.main:app",
            host="127.0.0.1",
            port=8002,
            log_level="info"
        )
    except Exception as e:
        print(f"[ERROR] {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        input("Press Enter to exit...")
