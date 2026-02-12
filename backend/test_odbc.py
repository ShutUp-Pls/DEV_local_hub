# test_odbc.py
import pyodbc
import os

# 1. Rutas (Ajusta esto a tu ruta REAL del archivo .mdb)
ruta_mdb = r"C:\Users\Usuario\Documentos\rjc_prod_f1578.mdb" 

print(f"--- DIAGNÓSTICO DE CONEXIÓN ---")
print(f"1. Verificando archivo: {ruta_mdb}")
if os.path.exists(ruta_mdb):
    print("   [OK] El archivo existe.")
else:
    print("   [ERROR] El archivo NO existe en esa ruta. Revisa la ruta.")

print("\n2. Drivers ODBC Instalados:")
drivers = pyodbc.drivers()
access_drivers = [d for d in drivers if 'Access' in d]

if not access_drivers:
    print("   [ERROR CRÍTICO] No se detectaron drivers de Microsoft Access.")
    print("   Necesitas instalar el 'Microsoft Access Database Engine 2016 Redistributable'.")
else:
    for d in access_drivers:
        print(f"   - {d}")

print("\n3. Intentando conectar...")
try:
    # Probamos los dos nombres de driver más comunes
    driver_name = "Microsoft Access Driver (*.mdb, *.accdb)"
    if driver_name not in drivers:
        driver_name = "Microsoft Access Driver (*.mdb)" # Versión antigua
    
    conn_str = f'DRIVER={{{driver_name}}};DBQ={ruta_mdb};'
    conn = pyodbc.connect(conn_str)
    print("   [ÉXITO] ¡Conexión establecida correctamente!")
    conn.close()
except Exception as e:
    print(f"   [FALLO] Error de conexión:\n   {e}")
    print("\n   PISTA: Si dice 'Data source name not found', te falta el driver.")
    print("   PISTA: Si dice 'Architecture mismatch', estás mezclando Python 64bit con Office 32bit.")