import subprocess
import csv
import io

def obtener_producto_por_codigo_linux(ruta_base_datos, codigo_barras):
    """
    Busca un producto por su código de barras usando mdb-export (MDBTools).
    """
    tabla = "producto" # Asegúrate de que este es el nombre real de la tabla en Access
    
    # Comando para exportar la tabla a CSV en memoria
    cmd = ['mdb-export', ruta_base_datos, tabla]
    
    try:
        # Ejecutar el comando y capturar la salida
        proceso = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        salida, error = proceso.communicate()

        if proceso.returncode != 0:
            print(f"Error al leer el archivo MDB: {error}")
            return None

        # Leer el CSV generado en memoria
        lector_csv = csv.DictReader(io.StringIO(salida))

        # Buscar el código (iteración manual)
        # Nota: Esto es menos eficiente que SQL para DBs gigantes, 
        # pero es la forma estándar de hacerlo con mdbtools en Linux.
        for fila in lector_csv:
            if fila.get('codigo') == codigo_barras: # Asegúrate que la columna se llama 'codigo'
                return fila
        
        return None

    except FileNotFoundError:
        print("Error: No se encontró la herramienta 'mdb-export'. Ejecuta: sudo apt install mdbtools")
        return None
    except Exception as e:
        print(f"Error inesperado: {e}")
        return None

# --- Ejemplo de uso ---
archivo_mdb = r'/home/shutuppls/Documentos/rjc_prod_f1578.mdb'
codigo_a_buscar = '1111'

resultado = obtener_producto_por_codigo_linux(archivo_mdb, codigo_a_buscar)

if resultado:
    print("Información del producto encontrada:")
    for llave, valor in resultado.items():
        print(f"{llave}: {valor}")
else:
    print("Producto no encontrado.")