import re
import bcrypt
from datetime import datetime

from bs4 import BeautifulSoup
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

import rjc_conexion as rjc
import local_db as lcl

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginRequest(BaseModel):
    username: str
    password: str

class BusquedaRequest(BaseModel):
    codigo: str

class ProductoForm(BaseModel):
    txtcodigo: str
    txtcod_interno: Optional[str] = ""
    txtnombre: str
    txtfamilia_producto: str
    txtsubfamilia_producto: Optional[str] = ""
    txtunidad: str
    txtiva: str
    txtid_impuestos1: Optional[str] = "0"
    txtprecio_venta: str
    txtprecio_venta_boleta: str
    txtstock_critico: str
    txtdias_reposion: Optional[str] = "0"
    txtvigente: str
    txtfactor_compra: Optional[str] = "0"
    txtid_producto: str
    txtfecha_creacion: Optional[str] = ""
    txtporcentaje_iva: Optional[str] = "19"

@app.get("/api/check-rjc")
def check_rjc_status():
    if rjc.sesion_global_rjc:
        rjc.sesion_global_rjc.headers.update(rjc.HEADERS_NAVEGADOR)
        print("[*] Verificando sesión existente en memoria...")
        if rjc.validar_sesion_activa(rjc.sesion_global_rjc):
            print("[V] La sesión actual es válida. Reutilizando.")
            return {"status": "connected", "message": "Conectado a RJC (Sesión mantenida)"}
        else:
            print("[X] La sesión en memoria caducó. Se intentará reconectar.")
            rjc.sesion_global_rjc = None

    session = rjc.obtener_sesion_rjc(rjc.RJC_EMAIL, rjc.RJC_CLAVE)
    
    if session:
        session.headers.update(rjc.HEADERS_NAVEGADOR)
        rjc.sesion_global_rjc = session
        return {"status": "connected", "message": "Conectado a RJC (Nueva sesión)"}
    else:
        rjc.sesion_global_rjc = None
        return {"status": "failed", "message": "Fallo la conexión con RJC"}

@app.post("/api/login")
def login(data: LoginRequest):
    users_db = rjc.cargar_usuarios()
    user = users_db.get(data.username)
    if not user: raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    password_provided = data.password.encode('utf-8')
    stored_hash = user["hashed_password"].encode('utf-8')

    if not bcrypt.checkpw(password_provided, stored_hash):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    return {"id": user["username"], "username": user["username"], "status": "active"}

@app.post("/api/buscar-producto-local")
def buscar_producto_local_endpoint(data: BusquedaRequest):
    print(f"[*] Buscando LOCALMENTE código: {data.codigo}...")
    try:
        producto = lcl.buscar_producto_local(data.codigo)
        
        if producto:
            print(f"[V] Producto encontrado en local: {producto['txtnombre']}")
            return producto
        else:
            print(f"[!] Producto {data.codigo} no encontrado en local.")
            return {"found": False, "message": f"Producto no encontrado en Base Local ({data.codigo})"}
            
    except Exception as e:
        print(f"Error Local Search: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/buscar-producto")
def buscar_producto_detalle(data: BusquedaRequest):
    session = rjc.get_session()
    
    # Variable para guardar el ID encontrado
    id_producto_rjc = None
    origen_dato = "DESCONOCIDO"

    # ------------------------------------------------------------------
    # PASO 1: INTENTO LOCAL (Atajo Rápido)
    # ------------------------------------------------------------------
    try:
        print(f"[*] [Híbrido] Consultando caché local para: {data.codigo}...")
        prod_local = lcl.buscar_producto_local(data.codigo)
        
        # Solo confiamos si devuelve un ID válido diferente de 0
        if prod_local and prod_local.get("txtid_producto") and prod_local.get("txtid_producto") != "0":
            id_producto_rjc = prod_local["txtid_producto"]
            origen_dato = "LOCAL"
            print(f"[V] [Híbrido] ID encontrado localmente: {id_producto_rjc}. Saltando búsqueda Web.")
        else:
            print("[!] No encontrado en local o sin ID válido. Pasando a Web...")

    except Exception as e:
        print(f"[!] Error en consulta local (Saltando a Web): {e}")

    # ------------------------------------------------------------------
    # PASO 2: INTENTO WEB (Lógica Original Restaurada)
    # ------------------------------------------------------------------
    if not id_producto_rjc:
        print(f"[*] Iniciando búsqueda WEB para código: {data.codigo}...")
        try:
            url_buscar = f"{rjc.BASE_URL}/producto/buscar.aspx"
            
            payload, _, _ = rjc.obtener_payload_completo(session, url_buscar)
            
            payload["txtcodigo_bus"] = data.codigo
            # CORRECCIÓN: Volvemos a 100. Si buscas "6", RJC puede mostrar "16", "26"... antes que el "6".
            # Con 20 registros, el "6" real quedaba fuera de la página.
            payload["txttotal_registros_bus"] = "100"
            payload["bt_buscar"] = "Buscar" 

            resp_busqueda = session.post(url_buscar, data=payload)
            resp_busqueda.encoding = 'latin-1'

            soup_tabla = BeautifulSoup(resp_busqueda.text, 'html.parser')
            
            # --- LÓGICA ORIGINAL RESTAURADA (Exactamente la que funcionaba) ---
            
            # 1. Intento por coincidencia exacta de texto en el link (Ej: <a>6</a>)
            target_link = soup_tabla.find("a", string=lambda t: t and t.strip() == data.codigo.strip())

            # 2. Si falla, intento por Regex en onclick (Tu lógica original)
            if not target_link:
                links_con_onclick = soup_tabla.find_all("a", onclick=True)
                for link in links_con_onclick:
                    match_val = re.search(r"modificar\s*\(\s*['\"]([^'\"]+)['\"]\s*,\s*['\"]([^'\"]+)['\"]\s*\)", link['onclick'])
                    if match_val:
                        codigo_encontrado = match_val.group(1)
                        # Comparamos ignorando espacios
                        if codigo_en_fila := codigo_encontrado.strip() == data.codigo.strip():
                            target_link = link
                            break
            
            if not target_link:
                print(f"[X] El producto {data.codigo} no aparece en la tabla de búsqueda web.")
                return {"found": False, "message": f"No se encontró el producto {data.codigo} en RJC."}

            # Extraer ID del link encontrado
            onclick_text = target_link['onclick']
            match = re.search(r"modificar\s*\(\s*['\"]?([^'\",]+)['\"]?\s*,\s*['\"]?([^'\",]+)['\"]?\s*\)", onclick_text)
            
            if match:
                id_producto_rjc = match.group(2)
                origen_dato = "WEB"
                print(f"[V] ¡Encontrado en WEB! ID: {id_producto_rjc}")
            else:
                return {"found": False, "message": "Error leyendo ID del producto"}

        except Exception as e:
            print(f"Error Crítico Búsqueda Web: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    # ------------------------------------------------------------------
    # PASO 3: OBTENER FICHA TÉCNICA (Común para ambos)
    # ------------------------------------------------------------------
    try:
        print(f"[*] [Ficha] Descargando detalle ID: {id_producto_rjc} (Origen: {origen_dato})...")
        url_modificar = f"{rjc.BASE_URL}/producto/modificar.aspx"
        
        # Hacemos POST directo con el ID encontrado
        payload_detalle, soup_detalle, resp_detalle = rjc.obtener_payload_completo(
            session, 
            url_modificar, 
            method="POST", 
            data_prev={"txtid_producto": id_producto_rjc}
        )
        
        def get_val(field_name):
            tag = soup_detalle.find("input", {"name": field_name})
            if tag: return tag.get("value", "")
            
            select = soup_detalle.find("select", {"name": field_name})
            if select:
                option = select.find("option", selected=True)
                if option: return option.get("value", "")
                
                script_pattern = rf"frmmodificar\.{field_name}\.value\s*=\s*['\"]([^'\"]*)['\"]"
                match_js = re.search(script_pattern, resp_detalle.text)
                if match_js: return match_js.group(1)
            return ""

        producto = {
            "found": True,
            "txtcodigo": get_val("txtcodigo") or data.codigo,
            "txtcod_interno": get_val("txtcod_interno"),
            "txtnombre": get_val("txtnombre"),
            "txtfamilia_producto": get_val("txtfamilia_producto"),
            "txtsubfamilia_producto": get_val("txtsubfamilia_producto"),
            "txtunidad": get_val("txtunidad"),
            "txtiva": get_val("txtiva"),
            "txtid_impuestos1": get_val("txtid_impuestos1"),
            "txtprecio_venta": get_val("txtprecio_venta"),
            "txtprecio_venta_boleta": get_val("txtprecio_venta_boleta"),
            "txtstock_critico": get_val("txtstock_critico"),
            "txtdias_reposion": get_val("txtdias_reposion"),
            "txtvigente": get_val("txtvigente"),
            "txtfactor_compra": get_val("txtfactor_compra"),
            "txtid_producto": id_producto_rjc,
            "txtfecha_creacion": get_val("txtfecha_creacion"),
            "txtporcentaje_iva": get_val("txtporcentaje_iva") or "19"
        }
        
        if not producto["txtnombre"]:
             return {"found": False, "message": "Error: Ficha técnica vacía o ilegible."}
        
        return producto

    except Exception as e:
        print(f"Error cargando detalle final: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/guardar-producto")
def guardar_producto(data: ProductoForm):
    session = rjc.get_session()
    
    try:
        print("[*] [Guardar] Accediendo directo a ficha remota...")
        url_modificar = f"{rjc.BASE_URL}/producto/modificar.aspx"
        
        # Obtenemos el ViewState y cookies necesarios en un solo viaje
        payload_refresh, _, _ = rjc.obtener_payload_completo(
            session, 
            url_modificar, 
            method="POST", 
            data_prev={"txtid_producto": data.txtid_producto}
        )

        datos_frontend = data.dict()

        # Si venimos de búsqueda local, la fecha llega vacía ("").
        # Si la enviamos vacía, el servidor explota (StartIndex Error).
        # Recuperamos la fecha real que nos acaba de dar el servidor en 'payload_refresh'.
        if not datos_frontend.get("txtfecha_creacion"):
            server_date = payload_refresh.get("txtfecha_creacion", "")
            
            if server_date:
                # Caso ideal: Usamos la fecha que ya tiene el servidor
                del datos_frontend["txtfecha_creacion"] 
            else:
                # Caso emergencia: El servidor tampoco tiene fecha, inventamos una para que no falle.
                fallback_date = datetime.now().strftime("%d/%m/%Y")
                print(f"[!] Fecha perdida. Usando fallback: {fallback_date}")
                datos_frontend["txtfecha_creacion"] = fallback_date

        # Preparamos el paquete final
        payload_final = payload_refresh.copy()
        payload_final.update(datos_frontend)
        
        # --- GUARDADO CON REFERER (La clave del éxito) ---
        url_guardar = f"{rjc.BASE_URL}/producto/modificar_gra.aspx"
        print(f"[*] Guardando cambios remotos ID: {data.txtid_producto}...")
        
        # Simulamos ser un navegador real viniendo de modificar.aspx
        headers_extra = {
            "Referer": url_modificar,
            "Origin": rjc.BASE_URL,
            "Content-Type": "application/x-www-form-urlencoded"
        }
        session.headers.update(headers_extra)
        
        resp_guardar = session.post(url_guardar, data=payload_final)
        resp_guardar.encoding = 'latin-1'
        
        # Limpieza inmediata de headers
        del session.headers["Referer"]
        del session.headers["Origin"]
        
        # --- VALIDACIÓN ---
        remote_success = False
        texto_respuesta = resp_guardar.text.lower()
        
        if "producto modificado" in texto_respuesta or "grabado" in texto_respuesta: 
            remote_success = True
        else:
            # Si falla, hacemos un debug rápido del título
            soup_err = BeautifulSoup(resp_guardar.text, 'html.parser')
            for s in soup_err(["script", "style"]): s.extract()
            body_preview = soup_err.get_text(separator=' ', strip=True)[:150]
            
            print(f"[!] Fallo remoto. Respuesta: {body_preview}")
            return {"success": False, "message": f"RJC rechazó la grabación. {body_preview}..."}

        # --- SINCRONIZACIÓN LOCAL ---
        local_msg = ""
        if remote_success:
            # Si RJC aceptó, guardamos en SQLite
            datos_dict = data.dict()
            local_ok = lcl.sincronizar_producto_local(datos_dict)
            if local_ok: local_msg = " y sincronizado localmente"
            else: local_msg = " (pero falló la copia local)"

        return {"success": True, "message": f"Producto guardado correctamente{local_msg}"}

    except Exception as e:
        print(f"Error Guardando: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/api/obtener-subfamilias")
def obtener_subfamilias(data: dict):
    familia_id = data.get("familia_id", "0")
    if not familia_id: familia_id = "0"

    session = rjc.get_session()
    
    try:
        url = f"{rjc.BASE_URL}/producto/cargar_subfamilia.aspx?txtfamilia_producto={familia_id}"
        print(f"[*] Buscando subfamilias para familia {familia_id}...")
        
        resp = session.get(url, timeout=10)
        resp.encoding = 'latin-1'

        soup = BeautifulSoup(resp.text, 'xml')
        
        subfamilias = []
        for fila in soup.find_all("fila"):
            id_sub = fila.find("id_subfamilia").text
            nombre = fila.find("nombre").text
            subfamilias.append({"id": id_sub, "nombre": nombre})
            
        return {"subfamilias": subfamilias}

    except Exception as e:
        print(f"Error cargando subfamilias: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/crear-producto")
def crear_producto(data: ProductoForm):
    session = rjc.get_session()
    
    try:
        print(f"[*] Iniciando proceso de creación para: {data.txtcodigo}...")
        url_agregar = f"{rjc.BASE_URL}/producto/agregar.aspx"

        # 1. Obtener payload base
        payload_base, _, _ = rjc.obtener_payload_completo(session, url_agregar, method="GET")

        # 2. Preparar datos
        payload_final = payload_base.copy()
        datos_usuario = data.dict(exclude={"txtid_producto"}) # Excluimos ID porque es nuevo
        payload_final.update(datos_usuario)
        payload_final["bt_grabar"] = "Grabar"

        # 3. Enviar grabación
        url_grabar = f"{rjc.BASE_URL}/producto/agregar_gra.aspx"
        print(f"[*] Enviando datos a {url_grabar}...")
        
        headers_extra = {
            "Referer": url_agregar,
            "Origin": rjc.BASE_URL
        }
        session.headers.update(headers_extra)

        resp_guardar = session.post(url_grabar, data=payload_final)
        resp_guardar.encoding = 'latin-1'

        del session.headers["Referer"]
        del session.headers["Origin"]
        
        # 4. Validar éxito remoto
        remote_success = False
        if "producto grabado" in resp_guardar.text.lower(): 
            remote_success = True
        else:
            soup_err = BeautifulSoup(resp_guardar.text, 'html.parser')
            err_preview = soup_err.get_text(separator=' ', strip=True)[:200]
            print(f"[!] Fallo Creación Remota. Preview: {err_preview}")
            return {"success": False, "message": f"RJC no confirmó la creación: {err_preview}"}

        # 5. SINCRONIZACIÓN LOCAL (Aquí estaba el fallo de coordinación)
        local_msg = ""
        if remote_success:
            print("[*] Producto creado en WEB. Buscando ID asignado para sincronizar local...")
            
            # PASO A: Reutilizamos la lógica de búsqueda para obtener el ID real
            # Creamos un objeto dummy para la búsqueda
            req_busqueda = BusquedaRequest(codigo=data.txtcodigo)
            
            # Llamamos a la lógica de búsqueda (Ojo: esto hace una llamada HTTP extra a RJC,
            # pero es necesaria para obtener el ID seguro)
            producto_web = buscar_producto_detalle(req_busqueda)
            
            if producto_web and producto_web.get("found") and producto_web.get("txtid_producto"):
                nuevo_id = producto_web["txtid_producto"]
                print(f"[V] ID recuperado de RJC: {nuevo_id}")
                
                # PASO B: Preparamos datos para INSERTAR localmente
                datos_para_local = data.dict()
                datos_para_local["txtid_producto"] = nuevo_id # ASIGNAMOS EL ID REAL
                
                # Si la web devolvió fecha de creación, la usamos
                if producto_web.get("txtfecha_creacion"):
                    datos_para_local["txtfecha_creacion"] = producto_web["txtfecha_creacion"]

                # PASO C: Insertar (NO Actualizar)
                local_ok = lcl.crear_producto_local(datos_para_local)
                
                if local_ok: 
                    local_msg = f" y sincronizado localmente (ID: {nuevo_id})"
                else:
                    local_msg = " (pero falló la inserción local)"
            else:
                print("[!] Producto creado pero no se pudo recuperar el ID para sync local.")
                local_msg = " (Sincronización pendiente: No se obtuvo ID)"

        return {"success": True, "message": f"Producto creado exitosamente{local_msg}"}

    except Exception as e:
        print(f"Error Creando: {e}")
        raise HTTPException(status_code=500, detail=str(e))