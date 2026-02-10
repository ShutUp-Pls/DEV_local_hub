module.exports = {
  apps : [
    {
      name: "API-FastAPI",
      script: "python",
      // Ajusta la ruta a tu main.py. IMPORTANTE: --host 0.0.0.0 permite acceso desde la red
      args: "-m uvicorn main:app --host 0.0.0.0 --port 8000", 
      cwd: "./ruta/a/tu/backend", // Carpeta donde está main.py
      interpreter: "", // Dejar vacío si usas python global o ruta al venv/Scripts/python.exe
      env: {
        PYTHONUNBUFFERED: "1"
      }
    },
    {
      name: "WEB-NextJS",
      script: "server.js",
      cwd: "./ruta/a/tu/frontend/.next/standalone", // La carpeta compilada standalone
      env: {
        PORT: 3000,
        HOSTNAME: "0.0.0.0"
      }
    }
  ]
}