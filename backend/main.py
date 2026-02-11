import re
from bs4 import BeautifulSoup
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import bcrypt

import rjc_conexion as rjc
from local_db import sincronizar_producto_local

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
def login(data: rjc.LoginRequest):
    users_db = rjc.cargar_usuarios()
    user = users_db.get(data.username)
    if not user: raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    password_provided = data.password.encode('utf-8')
    stored_hash = user["hashed_password"].encode('utf-8')

    if not bcrypt.checkpw(password_provided, stored_hash):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    return {"id": user["username"], "username": user["username"], "status": "active"}

@app.post("/api/buscar-producto")
def buscar_producto_detalle(data: rjc.BusquedaRequest):
    session = rjc.get_session()
    
    try:
        url_buscar = f"{rjc.BASE_URL}/producto/buscar.aspx"
        
        payload, _, _ = rjc.obtener_payload_completo(session, url_buscar)
        
        payload["txtcodigo_bus"] = data.codigo
        payload["txttotal_registros_bus"] = "100"
        payload["bt_buscar"] = "Buscar" 

        print(f"[*] Buscando código: {data.codigo}...")

        resp_busqueda = session.post(url_buscar, data=payload)
        resp_busqueda.encoding = 'latin-1'
        

        soup_tabla = BeautifulSoup(resp_busqueda.text, 'html.parser')
        target_link = soup_tabla.find("a", string=lambda t: t and t.strip() == data.codigo.strip())

        if not target_link:
            links_con_onclick = soup_tabla.find_all("a", onclick=True)
            for link in links_con_onclick:
                match_val = re.search(r"modificar\s*\(\s*['\"]([^'\"]+)['\"]\s*,\s*['\"]([^'\"]+)['\"]\s*\)", link['onclick'])
                if match_val:
                    codigo_encontrado = match_val.group(1)
                    if codigo_encontrado == data.codigo.strip():
                        target_link = link
                        break
        
        if not target_link:
            print(f"[!] Producto con código exacto '{data.codigo}' no encontrado.")
            return {"found": False, "message": f"No se encontró el producto asociado al codigo: {data.codigo}"}

        onclick_text = target_link['onclick']
        print(f"[*] Link encontrado: {onclick_text}")
        

        match = re.search(r"modificar\s*\(\s*['\"]?([^'\",]+)['\"]?\s*,\s*['\"]?([^'\",]+)['\"]?\s*\)", onclick_text)
        if not match: return {"found": False, "message": "Error leyendo ID del producto"}
             
        id_producto = match.group(2)
        print(f"[*] ID encontrado: {id_producto}. Accediendo a detalle...")

        url_modificar = f"{rjc.BASE_URL}/producto/modificar.aspx"
        payload["txtid_producto"] = id_producto
        
        resp_detalle = session.post(url_modificar, data=payload)
        resp_detalle.encoding = 'latin-1'
        soup_detalle = BeautifulSoup(resp_detalle.text, 'html.parser')

        def get_val(field_name):
            tag = soup_detalle.find("input", {"name": field_name})
            if tag: return tag.get("value", "")
            
            select = soup_detalle.find("select", {"name": field_name})
            if select:
                option = select.find("option", selected=True)
                if option: return option.get("value", "")

                script_pattern = rf"frmmodificar\.{field_name}\.value\s*=\s*['\"]([^'\"]*)['\"]"
                script_match = re.search(script_pattern, resp_detalle.text)
                if script_match: return script_match.group(1)
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
            "txtid_producto": id_producto,
            "txtfecha_creacion": get_val("txtfecha_creacion"),
            "txtporcentaje_iva": get_val("txtporcentaje_iva") or "19"
        }
        
        if not producto["txtnombre"]:
             return {"found": False, "message": "Error al cargar ficha (campos vacíos)"}

        return producto

    except Exception as e:
        print(f"Error Deep Search: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/guardar-producto")
def guardar_producto(data: rjc.ProductoForm):
    session = rjc.get_session()
    
    try:
        print("[*] Obteniendo contexto para guardar...")
        url_modificar = f"{rjc.BASE_URL}/producto/modificar.aspx"
        
        payload_refresh, _, _ = rjc.obtener_payload_completo(session, url_modificar, method="POST", data_prev={"txtid_producto": data.txtid_producto})
        
        payload_final = payload_refresh.copy()
        payload_final.update(data.dict())
        
        url_guardar = f"{rjc.BASE_URL}/producto/modificar_gra.aspx"
        print(f"[*] Guardando cambios remotos ID: {data.txtid_producto}...")
        
        resp_guardar = session.post(url_guardar, data=payload_final)
        
        remote_success = False
        if "Producto modificado" in resp_guardar.text: remote_success = True
        else: return {"success": False, "message": "RJC Remoto no confirmó la grabación"}

        local_msg = ""
        if remote_success:
            datos_dict = data.dict()

            local_ok = sincronizar_producto_local(datos_dict)
            if local_ok: local_msg = " y sincronizado localmente"
            else: local_msg = " (pero falló la copia local, revisa la consola)"

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
def crear_producto(data: rjc.ProductoForm):
    session = rjc.get_session()
    
    try:
        print("[*] Iniciando proceso de creación de producto...")
        url_agregar = f"{rjc.BASE_URL}/producto/agregar.aspx"

        payload_base, _, _ = rjc.obtener_payload_completo(session, url_agregar, method="GET")

        payload_final = payload_base.copy()
    
        datos_usuario = data.dict(exclude={"txtid_producto"})
        payload_final.update(datos_usuario)

        payload_final["bt_grabar"] = "Grabar"

        url_grabar = f"{rjc.BASE_URL}/producto/agregar_gra.aspx"
        print(f"[*] Enviando datos a {url_grabar}...")
        
        resp_guardar = session.post(url_grabar, data=payload_final)
        
        remote_success = False
        if "Producto Grabado" in resp_guardar.text: remote_success = True
        else:
            print(f"[!] Respuesta sospechosa: {resp_guardar.text[:200]}...")
            return {"success": False, "message": "RJC no confirmó la creación (No se halló 'Producto Grabado')"}

        local_msg = ""
        if remote_success:
            local_ok = sincronizar_producto_local(data.dict())
            if local_ok: local_msg = " y sincronizado localmente"

        return {"success": True, "message": f"Producto creado exitosamente{local_msg}"}

    except Exception as e:
        print(f"Error Creando: {e}")
        raise HTTPException(status_code=500, detail=str(e))