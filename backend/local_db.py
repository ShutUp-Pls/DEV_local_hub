import platform
import pyodbc
import os
import subprocess
import csv
import io
from dotenv import load_dotenv

load_dotenv("../.env.local")

# Mantenemos esta función por si necesitas intentar escrituras, 
# aunque en Linux MDBTools suele ser de solo lectura.
def obtener_conexion_local():
    db_path = os.getenv("LOCAL_DATABASE")
    if not db_path or not os.path.exists(db_path):
        print(f"[!] Archivo MDB no encontrado en: {db_path}")
        return None

    driver = "MDBTools"
    connection_string = f'DRIVER={{{driver}}};DBQ={db_path};'
    try:
        conn = pyodbc.connect(connection_string, autocommit=True)
        return conn
    except Exception as e:
        print(f"[!] Error de conexión ODBC: {e}")
        return None

# --- FUNCIONES AUXILIARES ---

def safe_str(val):
    """Maneja valores None para evitar 'None' en el string final"""
    return str(val).strip() if val else ""

def safe_int(val):
    if not val: return 0
    try: return int(float(str(val)))
    except: return 0

def safe_float(val):
    if not val: return 0.0
    try: return float(str(val).replace(',', '.'))
    except: return 0.0

def safe_str(val):
    return str(val).strip() if val else ""

def buscar_producto_local(codigo: str):
    """
    Busca en MDB usando streaming (tubería) para NO cargar la RAM.
    Lee línea por línea y mata el proceso apenas encuentra el dato.
    """
    db_path = os.getenv("LOCAL_DATABASE")
    if not db_path or not os.path.exists(db_path):
        print("[X] Base de datos local no encontrada.")
        return None

    codigo_buscado = str(codigo).strip()
    
    # 1. Iniciamos el proceso, pero NO usamos .communicate()
    # bufsize=1 hace que la línea esté disponible apenas se escriba
    cmd = ['mdb-export', db_path, 'producto']
    proceso = subprocess.Popen(
        cmd, 
        stdout=subprocess.PIPE, 
        stderr=subprocess.PIPE, 
        text=True,
        bufsize=1 
    )

    try:
        # 2. Creamos el lector CSV conectado directamente al flujo de salida (stdout)
        # Esto no carga el archivo, solo espera que lleguen datos.
        lector_csv = csv.DictReader(proceso.stdout)

        producto_encontrado = None

        # 3. Iteramos. Python pedirá una línea, la procesará y la descartará de la RAM.
        for fila in lector_csv:
            # Chequeo rápido de coincidencia
            if (fila.get('codigo', '').strip() == codigo_buscado or 
                fila.get('cod_interno', '').strip() == codigo_buscado):
                
                producto_encontrado = fila
                break # ¡Encontrado! Salimos del bucle inmediatamente.

        # 4. Limpieza vital: Si encontramos el producto (o si cancelamos),
        # debemos matar el proceso mdb-export para que no siga leyendo el archivo en background.
        if proceso.poll() is None:
            proceso.terminate()
            try:
                proceso.wait(timeout=1)
            except subprocess.TimeoutExpired:
                proceso.kill()

        if not producto_encontrado:
            return None

        # 5. Mapeo de datos (Igual que antes)
        return {
            "found": True,
            "txtid_producto": safe_str(producto_encontrado.get('id_producto')),
            "txtcodigo": safe_str(producto_encontrado.get('codigo')),
            "txtcod_interno": safe_str(producto_encontrado.get('cod_interno')),
            "txtnombre": safe_str(producto_encontrado.get('nombre')),
            "txtfamilia_producto": safe_str(producto_encontrado.get('familia', '0')),
            "txtsubfamilia_producto": safe_str(producto_encontrado.get('subfamilia', '0')),
            "txtunidad": safe_str(producto_encontrado.get('unidad', 'UN')),
            "txtiva": safe_str(producto_encontrado.get('afecto_iva', 'S')),
            "txtid_impuestos1": safe_str(producto_encontrado.get('id_impuestos', '0')),
            "txtprecio_venta": safe_str(producto_encontrado.get('precio_venta', '0')),
            "txtprecio_venta_boleta": safe_str(producto_encontrado.get('precio_venta_boleta', '0')),
            "txtstock_critico": safe_str(producto_encontrado.get('stock_critico', '0')),
            "txtdias_reposion": safe_str(producto_encontrado.get('dias_reposion', '0')),
            "txtvigente": safe_str(producto_encontrado.get('vigente', 'S')),
            "txtfactor_compra": safe_str(producto_encontrado.get('factor_compra', '1')),
            "txtfecha_creacion": "", 
            "txtporcentaje_iva": "19" 
        }

    except Exception as e:
        print(f"[X] Error en búsqueda streaming: {e}")
        # Asegurar muerte del subproceso en caso de error
        if proceso.poll() is None:
            proceso.kill()
        return None

def sincronizar_producto_local(data: dict):
    """
    Actualiza la tabla 'producto' local.
    """
    print(f"[*] Sincronización local ID: {data.get('txtid_producto')}...")
    
    conn = obtener_conexion_local()
    if not conn: return False

    cursor = conn.cursor()

    try:
        # 1. Conversión estricta de tipos basada en estructura_mdb.txt
        id_producto = safe_int(data['txtid_producto']) # Long Integer
        
        nombre = str(data['txtnombre'])[:80]           # Text(80)
        cod_interno = str(data['txtcod_interno'])[:20] # Text(20)
        
        familia = safe_int(data['txtfamilia_producto'])     # Long Integer
        subfamilia = safe_int(data['txtsubfamilia_producto']) # Long Integer
        
        unidad = str(data['txtunidad'])[:10]           # Text(10)
        afecto_iva = str(data['txtiva'])[:1]           # Text(1)
        
        id_impuestos = safe_int(data['txtid_impuestos1']) # Integer
        
        precio_venta = safe_float(data['txtprecio_venta'])             # Numeric
        precio_venta_boleta = safe_float(data['txtprecio_venta_boleta']) # Numeric
        
        stock_critico = safe_float(data['txtstock_critico']) # Numeric
        dias_reposion = safe_int(data['txtdias_reposion'])   # Integer (Columna con typo)
        
        vigente = str(data['txtvigente'])[:1]          # Text(1)
        factor_compra = safe_int(data['txtfactor_compra']) # Integer

        # 2. Query con nombres de columna exactos
        sql = """
            UPDATE producto 
            SET 
                nombre = ?,
                cod_interno = ?,
                familia = ?,
                subfamilia = ?,
                unidad = ?,
                afecto_iva = ?,
                id_impuestos = ?,
                precio_venta = ?,
                precio_venta_boleta = ?,
                stock_critico = ?,
                dias_reposion = ?,
                vigente = ?,
                factor_compra = ?
            WHERE id_producto = ?
        """
        
        params = (
            nombre, 
            cod_interno, 
            familia, 
            subfamilia, 
            unidad, 
            afecto_iva, 
            id_impuestos, 
            precio_venta, 
            precio_venta_boleta, 
            stock_critico, 
            dias_reposion, 
            vigente, 
            factor_compra,
            id_producto
        )

        cursor.execute(sql, params)
        print(f"[V] Producto {id_producto} sincronizado localmente.")
        return True

    except Exception as e:
        print(f"[X] Error UPDATE local: {e}")
        # Tip para debugging en Linux
        if "Read-only" in str(e):
            print("[!] MDBTools en Linux suele ser de solo lectura para UPDATEs.")
        return False
    finally:
        try:
            cursor.close()
            conn.close()
        except: pass