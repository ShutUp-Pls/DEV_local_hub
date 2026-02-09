import os
import shutil

def copiar_y_renombrar(rutas_archivos, carpeta_destino):
    # Crear la carpeta de destino si no existe
    if not os.path.exists(carpeta_destino):
        os.makedirs(carpeta_destino)
        print(f"Carpeta creada: {carpeta_destino}")

    for ruta in rutas_archivos:
        if os.path.isfile(ruta):
            # Obtener el nombre del archivo con extensión
            nombre_archivo = os.path.basename(ruta)
            # Obtener el nombre de la carpeta que lo contiene
            nombre_carpeta_padre = os.path.basename(os.path.dirname(ruta))
            
            # Separar nombre y extensión para el formato solicitado
            nombre_base, extension = os.path.splitext(nombre_archivo)
            
            # Nuevo nombre: nombreoriginal-nombrecarpetacontenedora.extension
            nuevo_nombre = f"{nombre_base}-{nombre_carpeta_padre}{extension}"
            
            # Definir la ruta completa de destino
            ruta_final = os.path.join(carpeta_destino, nuevo_nombre)
            
            try:
                shutil.copy2(ruta, ruta_final)
                print(f"Copiado: {nombre_archivo} -> {nuevo_nombre}")
            except Exception as e:
                print(f"Error al copiar {nombre_archivo}: {e}")
        else:
            print(f"La ruta no es un archivo válido: {ruta}")

frontend = [
    "/home/shutuppls/Documentos/Github/local-hub/app/layout.tsx",
    "/home/shutuppls/Documentos/Github/local-hub/app/inicio-sesion/page.tsx",

    "/home/shutuppls/Documentos/Github/local-hub/app/inicio/page.tsx",
    "/home/shutuppls/Documentos/Github/local-hub/app/inicio/components/AppCard.tsx",
    "/home/shutuppls/Documentos/Github/local-hub/app/inicio/components/Navbar.tsx"
]

destino = "/home/shutuppls/Documentos/Github/local-hub/.temp"

copiar_y_renombrar(frontend, destino)