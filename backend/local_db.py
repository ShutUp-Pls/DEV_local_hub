# local_db.py
import platform
import pyodbc
import os
from dotenv import load_dotenv

# Cargar variables de entorno para obtener la ruta
load_dotenv(".env.local")

def obtener_conexion_local():
    db_path = os.getenv("LOCAL_DATABASE")
    
    if not db_path or not os.path.exists(db_path):
        print(f"[!] Error Local DB: No se encuentra el archivo en {db_path}")
        return None

    if platform.system() == 'Windows':
        driver = "Microsoft Access Driver (*.mdb, *.accdb)"
    else:
        driver = "MDBTools"

    connection_string = f'DRIVER={{{driver}}};DBQ={db_path};'
    
    try:
        conn = pyodbc.connect(connection_string, autocommit=True)
        return conn
    except Exception as e:
        print(f"[!] Error conectando a MDB local: {e}")
        return None

def sincronizar_producto_local(data: dict):
    """
    Recibe el diccionario de datos del formulario y actualiza la tabla 'producto' local.
    """
    print(f"[*] Iniciando sincronización local para ID: {data['txtid_producto']}...")
    
    conn = obtener_conexion_local()
    if not conn:
        return False

    cursor = conn.cursor()

    try:
        # Conversión de tipos para coincidir con estructura_mdb.txt
        # Numeric/Long/Integer requieren números, no strings
        def to_float(val):
            try: return float(str(val).replace(',', '.'))
            except: return 0.0
            
        def to_int(val):
            try: return int(val)
            except: return 0

        # Mapeo de valores
        id_producto = data['txtid_producto'] # Long Integer en DB
        nombre = data['txtnombre'] # Text(80)
        codigo = data['txtcodigo'] # Text(50)
        cod_interno = data['txtcod_interno'] # Text(20)
        
        familia = to_int(data['txtfamilia_producto']) # Long Integer
        subfamilia = to_int(data['txtsubfamilia_producto']) # Long Integer
        
        unidad = data['txtunidad'] # Text(10)
        afecto_iva = data['txtiva'] # Text(1)
        
        # En el form es txtid_impuestos1, en DB es id_impuestos (Integer)
        id_impuestos = to_int(data['txtid_impuestos1']) 
        
        precio_venta = to_float(data['txtprecio_venta']) # Numeric (Neto)
        precio_venta_boleta = to_float(data['txtprecio_venta_boleta']) # Numeric (Bruto)
        
        stock_critico = to_float(data['txtstock_critico']) # Numeric
        dias_reposion = to_int(data['txtdias_reposion']) # Integer
        
        vigente = data['txtvigente'] # Text(1)
        
        # Factor compra parece ser el campo usado para 'Comanda Cocina' o similar según contexto
        factor_compra = to_int(data['txtfactor_compra']) # Integer

        # QUERY SQL DE ACTUALIZACIÓN
        # Access usa ? como placeholder
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
            id_producto # WHERE clause
        )

        cursor.execute(sql, params)
        print(f"[V] Producto {id_producto} sincronizado localmente con éxito.")
        return True

    except Exception as e:
        print(f"[X] Error ejecutando UPDATE local: {e}")
        return False
    finally:
        cursor.close()
        conn.close()