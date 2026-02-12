module.exports = {
  apps : [
    {
      name: "API-FastAPI",
      script: "python",
      args: "-m uvicorn main:app --host 0.0.0.0 --port 8000", 
      cwd: "./ruta/a/tu/backend", 
      env: {
        PYTHONUNBUFFERED: "1",
        LOCAL_DATABASE: "C:\\Users\\Usuario\\Documentos\\rjc_prod_f1578.mdb" 
      }
    },
    {
      name: "WEB-NextJS",
      script: "server.js",
      cwd: "./ruta/a/tu/frontend/.next/standalone", 
      env: {
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
        NEXTAUTH_URL: "http://192.168.1.11:3000", 
        NEXTAUTH_SECRET: "una_clave_super_secreta_y_larga_aleatoria",
        AUTH_TRUST_HOST: "true", 
        NEXT_PUBLIC_API_URL: "http://192.168.1.11:8000",
        NEXT_PUBLIC_PRINCIPAL_URL: "http://192.168.1.11:3000",
        LOCAL_DATABASE: "C:\\Users\\Usuario\\Documentos\\rjc_prod_f1578.mdb" 
      }
    }
  ]
}