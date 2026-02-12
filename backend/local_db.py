import platform
import os
import subprocess
import csv
import sqlite3
import pyodbc
from dotenv import load_dotenv

load_dotenv("../.env.local")

SISTEMA = platform.system() # 'Windows' o 'Linux' o 'Darwin' para Mac
ES_WINDOWS = (SISTEMA == "Windows")

DB_MDB_PATH = os.getenv("LOCAL_DATABASE")
DB_SQLITE_PATH = "productos_local.sqlite"

def safe_str(val):
    return str(val).strip() if val else ""

def safe_int(val):
    if not val: return 0
    try: return int(float(str(val)))
    except: return 0

def safe_float(val):
    if not val: return 0.0
    try: return float(str(val).replace(',', '.'))
    except: return 0.0

# ==========================================
# BLOQUE WINDOWS (Directo al MDB)
# ==========================================

def conectar_mdb_windows():
    if not os.path.exists(DB_MDB_PATH):
        print(f"[X] No se encuentra el archivo .mdb en: {DB_MDB_PATH}")
        return None
    
    # Driver estándar de Access. 
    # Asegúrate de tener instalado "Microsoft Access Database Engine"
    driver = "Microsoft Access Driver (*.mdb, *.accdb)"
    conn_str = f'DRIVER={{{driver}}};DBQ={DB_MDB_PATH};'
    
    try:
        return pyodbc.connect(conn_str)
    except Exception as e:
        print(f"[X] Error conectando ODBC (Windows): {e}")
        return None

def buscar_windows(codigo):
    conn = conectar_mdb_windows()
    if not conn: return None
    
    cursor = conn.cursor()
    try:
        # Consulta directa al MDB
        sql = "SELECT * FROM producto WHERE codigo = ? OR cod_interno = ?"
        cursor.execute(sql, (codigo, codigo))
        row = cursor.fetchone()
        
        if not row: return None
        
        # Mapeo de columnas (PyODBC devuelve objetos Row accesibles por nombre si se configura, o por índice)
        # Para seguridad, accedemos por nombre usando cursor.description
        col_names = [column[0].lower() for column in cursor.description]
        row_dict = dict(zip(col_names, row))

        return {
            "found": True,
            "txtid_producto": safe_str(row_dict.get('id_producto')),
            "txtcodigo": safe_str(row_dict.get('codigo')),
            "txtcod_interno": safe_str(row_dict.get('cod_interno')),
            "txtnombre": safe_str(row_dict.get('nombre')),
            "txtfamilia_producto": safe_str(row_dict.get('familia')),
            "txtsubfamilia_producto": safe_str(row_dict.get('subfamilia')),
            "txtunidad": safe_str(row_dict.get('unidad')),
            "txtiva": safe_str(row_dict.get('afecto_iva')),
            "txtid_impuestos1": safe_str(row_dict.get('id_impuestos')),
            "txtprecio_venta": safe_str(row_dict.get('precio_venta')),
            "txtprecio_venta_boleta": safe_str(row_dict.get('precio_venta_boleta')),
            "txtstock_critico": safe_str(row_dict.get('stock_critico')),
            "txtdias_reposion": safe_str(row_dict.get('dias_reposion')),
            "txtvigente": safe_str(row_dict.get('vigente')),
            "txtfactor_compra": safe_str(row_dict.get('factor_compra')),
            "txtfecha_creacion": "", 
            "txtporcentaje_iva": "19" 
        }
    except Exception as e:
        print(f"[X] Error Búsqueda Windows: {e}")
        return None
    finally:
        conn.close()

def actualizar_windows(data):
    conn = conectar_mdb_windows()
    if not conn: return False
    
    cursor = conn.cursor()
    try:
        id_producto = safe_int(data['txtid_producto'])
        
        sql = """
            UPDATE producto 
            SET 
                nombre = ?, cod_interno = ?, familia = ?, subfamilia = ?, 
                unidad = ?, afecto_iva = ?, id_impuestos = ?, 
                precio_venta = ?, precio_venta_boleta = ?, 
                stock_critico = ?, dias_reposion = ?, vigente = ?, factor_compra = ?
            WHERE id_producto = ?
        """
        
        params = (
            str(data['txtnombre'])[:80],
            str(data['txtcod_interno'])[:20],
            safe_int(data['txtfamilia_producto']),
            safe_int(data['txtsubfamilia_producto']),
            str(data['txtunidad'])[:10],
            str(data['txtiva'])[:1],
            safe_int(data['txtid_impuestos1']),
            safe_float(data['txtprecio_venta']),
            safe_float(data['txtprecio_venta_boleta']),
            safe_float(data['txtstock_critico']),
            safe_int(data['txtdias_reposion']),
            str(data['txtvigente'])[:1],
            safe_int(data['txtfactor_compra']),
            id_producto
        )

        cursor.execute(sql, params)
        conn.commit()
        print(f"[V] (WIN) Producto {id_producto} actualizado DIRECTAMENTE en MDB.")
        return True
    except Exception as e:
        print(f"[X] Error UPDATE Windows: {e}")
        return False
    finally:
        conn.close()

def insertar_windows(data):
    conn = conectar_mdb_windows()
    if not conn: return False
    
    cursor = conn.cursor()
    try:
        # Asumimos que podemos insertar el ID manualmente para mantener sincronía.
        # Si la columna id_producto es Autonumérica estricta en Access, esto podría fallar,
        # pero generalmente en sistemas sincronizados es un Long Integer.
        sql = """
            INSERT INTO producto (
                id_producto, codigo, cod_interno, nombre, familia, subfamilia, 
                unidad, afecto_iva, id_impuestos, precio_venta, precio_venta_boleta, 
                stock_critico, dias_reposion, vigente, factor_compra
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        params = (
            safe_int(data['txtid_producto']),
            str(data['txtcodigo'])[:20],
            str(data['txtcod_interno'])[:20],
            str(data['txtnombre'])[:80],
            safe_int(data['txtfamilia_producto']),
            safe_int(data['txtsubfamilia_producto']),
            str(data['txtunidad'])[:10],
            str(data['txtiva'])[:1],
            safe_int(data['txtid_impuestos1']),
            safe_float(data['txtprecio_venta']),
            safe_float(data['txtprecio_venta_boleta']),
            safe_float(data['txtstock_critico']),
            safe_int(data['txtdias_reposion']),
            str(data['txtvigente'])[:1],
            safe_int(data['txtfactor_compra'])
        )

        cursor.execute(sql, params)
        conn.commit()
        print(f"[V] (WIN) Producto {data['txtid_producto']} INSERTADO en MDB.")
        return True
    except Exception as e:
        print(f"[X] Error INSERT Windows: {e}")
        return False
    finally:
        conn.close()

# ==========================================
# BLOQUE LINUX (Puente SQLite)
# ==========================================

def inicializar_db_linux():
    """
    Aplica la lógica de tu búsqueda: Usa mdb-export para leer el MDB
    y vuelca los datos en un SQLite local que SI permite escritura.
    Solo corre si el MDB es más nuevo que el SQLite.
    """
    if not os.path.exists(DB_MDB_PATH):
        print(f"[X] No se encuentra el archivo MDB: {DB_MDB_PATH}")
        return False

    # Verificar si necesitamos sincronizar (Si el MDB se actualizó externamente)
    if os.path.exists(DB_SQLITE_PATH):
        mdb_time = os.path.getmtime(DB_MDB_PATH)
        sqlite_time = os.path.getmtime(DB_SQLITE_PATH)
        if sqlite_time > mdb_time:
            return True # SQLite ya está actualizado

    print("[*] Detectado cambio en MDB o inicio fresco. Migrando a SQLite...")
    
    # 1. Crear conexión a SQLite (se crea el archivo si no existe)
    conn = sqlite3.connect(DB_SQLITE_PATH)
    cursor = conn.cursor()

    # 2. Crear tabla (Esquema simplificado basado en tu código)
    cursor.execute("DROP TABLE IF EXISTS producto")
    cursor.execute("""
        CREATE TABLE producto (
            id_producto INTEGER PRIMARY KEY,
            codigo TEXT,
            cod_interno TEXT,
            nombre TEXT,
            familia INTEGER,
            subfamilia INTEGER,
            unidad TEXT,
            afecto_iva TEXT,
            id_impuestos INTEGER,
            precio_venta REAL,
            precio_venta_boleta REAL,
            stock_critico REAL,
            dias_reposion INTEGER,
            vigente TEXT,
            factor_compra INTEGER
        )
    """)
    # Índices para búsqueda instantánea (O(1) en vez de O(N) del CSV)
    cursor.execute("CREATE INDEX idx_codigo ON producto(codigo)")
    cursor.execute("CREATE INDEX idx_cod_interno ON producto(cod_interno)")
    
    conn.commit()

    # 3. USAR TU TÉCNICA DE SUBPROCESS (Streaming)
    # Esto evita cargar los 50k productos en RAM de Python.
    print("[*] Ejecutando mdb-export (Streaming)...")
    cmd = ['mdb-export', DB_MDB_PATH, 'producto']
    
    proceso = subprocess.Popen(
        cmd, 
        stdout=subprocess.PIPE, 
        stderr=subprocess.PIPE, 
        text=True,
        bufsize=1 
    )

    try:
        # Leemos el stream del proceso
        lector_csv = csv.DictReader(proceso.stdout)
        
        buffer_insert = []
        contador = 0

        # Insertamos en lotes para velocidad extrema
        sql_insert = """
            INSERT INTO producto VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """

        for fila in lector_csv:
            # Mapeo y limpieza al vuelo
            datos = (
                safe_int(fila.get('id_producto')),
                safe_str(fila.get('codigo')),
                safe_str(fila.get('cod_interno')),
                safe_str(fila.get('nombre')),
                safe_int(fila.get('familia')),
                safe_int(fila.get('subfamilia')),
                safe_str(fila.get('unidad')),
                safe_str(fila.get('afecto_iva')),
                safe_int(fila.get('id_impuestos')),
                safe_float(fila.get('precio_venta')),
                safe_float(fila.get('precio_venta_boleta')),
                safe_float(fila.get('stock_critico')),
                safe_int(fila.get('dias_reposion')),
                safe_str(fila.get('vigente')),
                safe_int(fila.get('factor_compra'))
            )
            buffer_insert.append(datos)
            
            if len(buffer_insert) >= 5000:
                cursor.executemany(sql_insert, buffer_insert)
                conn.commit()
                buffer_insert = []
                print(f"    -> Procesados {contador} registros...")
            
            contador += 1

        # Insertar remanentes
        if buffer_insert:
            cursor.executemany(sql_insert, buffer_insert)
            conn.commit()

        print(f"[V] Migración completada. Total: {contador} productos.")
        return True

    except Exception as e:
        print(f"[X] Error en migración MDB -> SQLite: {e}")
        return False
    finally:
        if proceso.poll() is None:
            proceso.kill()
        conn.close()

def buscar_linux(codigo):
    inicializar_db_linux()
    conn = sqlite3.connect(DB_SQLITE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM producto WHERE codigo = ? OR cod_interno = ? LIMIT 1", (codigo, codigo))
        fila = cursor.fetchone()
        if not fila: return None
        # Mapeo (copiar el de la respuesta anterior)
        return {
            "found": True,
            "txtid_producto": safe_str(fila['id_producto']),
            "txtcodigo": safe_str(fila['codigo']),
            "txtcod_interno": safe_str(fila['cod_interno']),
            "txtnombre": safe_str(fila['nombre']),
            "txtfamilia_producto": safe_str(fila['familia']),
            "txtsubfamilia_producto": safe_str(fila['subfamilia']),
            "txtunidad": safe_str(fila['unidad']),
            "txtiva": safe_str(fila['afecto_iva']),
            "txtid_impuestos1": safe_str(fila['id_impuestos']),
            "txtprecio_venta": safe_str(fila['precio_venta']),
            "txtprecio_venta_boleta": safe_str(fila['precio_venta_boleta']),
            "txtstock_critico": safe_str(fila['stock_critico']),
            "txtdias_reposion": safe_str(fila['dias_reposion']),
            "txtvigente": safe_str(fila['vigente']),
            "txtfactor_compra": safe_str(fila['factor_compra']),
            "txtfecha_creacion": "", "txtporcentaje_iva": "19" 
        }
    finally:
        conn.close()

def actualizar_linux(data):
    inicializar_db_linux()
    conn = sqlite3.connect(DB_SQLITE_PATH)
    cursor = conn.cursor()
    try:
        # (Lógica UPDATE SQLite idéntica a la anterior)
        id_prod = safe_int(data['txtid_producto'])
        sql = "UPDATE producto SET nombre=?, cod_interno=?, familia=?, subfamilia=?, unidad=?, afecto_iva=?, id_impuestos=?, precio_venta=?, precio_venta_boleta=?, stock_critico=?, dias_reposion=?, vigente=?, factor_compra=? WHERE id_producto=?"
        params = (
            str(data['txtnombre'])[:80], str(data['txtcod_interno'])[:20], safe_int(data['txtfamilia_producto']),
            safe_int(data['txtsubfamilia_producto']), str(data['txtunidad'])[:10], str(data['txtiva'])[:1],
            safe_int(data['txtid_impuestos1']), safe_float(data['txtprecio_venta']), safe_float(data['txtprecio_venta_boleta']),
            safe_float(data['txtstock_critico']), safe_int(data['txtdias_reposion']), str(data['txtvigente'])[:1],
            safe_int(data['txtfactor_compra']), id_prod
        )
        cursor.execute(sql, params)
        conn.commit()
        print(f"[V] (LINUX) Producto {id_prod} actualizado en SQLite.")
        return True
    except Exception as e:
        print(f"[X] Error UPDATE SQLite: {e}")
        return False
    finally:
        conn.close()

def insertar_linux(data):
    inicializar_db_linux()
    conn = sqlite3.connect(DB_SQLITE_PATH)
    cursor = conn.cursor()
    try:
        sql = """
            INSERT INTO producto (
                id_producto, codigo, cod_interno, nombre, familia, subfamilia, 
                unidad, afecto_iva, id_impuestos, precio_venta, precio_venta_boleta, 
                stock_critico, dias_reposion, vigente, factor_compra
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        params = (
            safe_int(data['txtid_producto']),
            str(data['txtcodigo'])[:20],
            str(data['txtcod_interno'])[:20],
            str(data['txtnombre'])[:80],
            safe_int(data['txtfamilia_producto']),
            safe_int(data['txtsubfamilia_producto']),
            str(data['txtunidad'])[:10],
            str(data['txtiva'])[:1],
            safe_int(data['txtid_impuestos1']),
            safe_float(data['txtprecio_venta']),
            safe_float(data['txtprecio_venta_boleta']),
            safe_float(data['txtstock_critico']),
            safe_int(data['txtdias_reposion']),
            str(data['txtvigente'])[:1],
            safe_int(data['txtfactor_compra'])
        )
        cursor.execute(sql, params)
        conn.commit()
        print(f"[V] (LINUX) Producto {data['txtid_producto']} INSERTADO en SQLite.")
        return True
    except Exception as e:
        print(f"[X] Error INSERT SQLite: {e}")
        return False
    finally:
        conn.close()


# ==========================================
# INTERFAZ PÚBLICA (El Router)
# ==========================================

def buscar_producto_local(codigo):
    if ES_WINDOWS: return buscar_windows(codigo)
    else: return buscar_linux(codigo)

def sincronizar_producto_local(data):
    # Esta es para MODIFICAR (UPDATE)
    if ES_WINDOWS: return actualizar_windows(data)
    else: return actualizar_linux(data)

def crear_producto_local(data):
    # Esta es NUEVA para INSERTAR (INSERT)
    if ES_WINDOWS: return insertar_windows(data)
    else: return insertar_linux(data)