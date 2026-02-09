import json
import re
import requests
from bs4 import BeautifulSoup
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import bcrypt
from pydantic import BaseModel
from typing import Optional
import os

from rjc_conexion import obtener_sesion_rjc, BASE_URL, validar_sesion_activa
from local_db import sincronizar_producto_local

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

RJC_EMAIL = "darien.oportobrandt@gmail.com"
RJC_CLAVE = "372619"
sesion_global_rjc = None

# Headers constantes para parecer un navegador real en TODAS las peticiones
HEADERS_NAVEGADOR = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
    "Connection": "keep-alive"
}

@app.get("/api/check-rjc")
def check_rjc_status():
    global sesion_global_rjc
    
    if sesion_global_rjc:
        # Aseguramos que la sesión tenga los headers correctos
        sesion_global_rjc.headers.update(HEADERS_NAVEGADOR)
        print("[*] Verificando sesión existente en memoria...")
        if validar_sesion_activa(sesion_global_rjc):
            print("[V] La sesión actual es válida. Reutilizando.")
            return {"status": "connected", "message": "Conectado a RJC (Sesión mantenida)"}
        else:
            print("[X] La sesión en memoria caducó. Se intentará reconectar.")
            sesion_global_rjc = None

    session = obtener_sesion_rjc(RJC_EMAIL, RJC_CLAVE)
    
    if session:
        # Importante: Configurar headers en la nueva sesión
        session.headers.update(HEADERS_NAVEGADOR)
        sesion_global_rjc = session
        return {"status": "connected", "message": "Conectado a RJC (Nueva sesión)"}
    else:
        sesion_global_rjc = None
        return {"status": "failed", "message": "Fallo la conexión con RJC"}

class LoginRequest(BaseModel):
    username: str
    password: str

class BusquedaRequest(BaseModel):
    codigo: str

# Definición del modelo igual que antes...
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

def get_session():
    global sesion_global_rjc
    if sesion_global_rjc:
        sesion_global_rjc.headers.update(HEADERS_NAVEGADOR) # Reforzar headers
        if validar_sesion_activa(sesion_global_rjc):
            return sesion_global_rjc
        else:
            sesion_global_rjc = None

    session = obtener_sesion_rjc(RJC_EMAIL, RJC_CLAVE)
    if session:
        session.headers.update(HEADERS_NAVEGADOR) # Reforzar headers
        sesion_global_rjc = session
        return session
    else:
        raise HTTPException(status_code=503, detail="No se pudo conectar a RJC")

def cargar_usuarios():
    try:
        with open("users_db.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return {}
    
def obtener_payload_completo(session, url, method="GET", data_prev=None):
    print(f"[*] Navegando a {url} ({method})...")
    try:
        if method == "GET":
            resp = session.get(url, timeout=15)
        else:
            resp = session.post(url, data=data_prev, timeout=15)
            
        # Intentar detectar encoding correcto
        if 'charset=' in resp.headers.get('content-type', '').lower():
            resp.encoding = resp.encoding
        else:
            resp.encoding = 'latin-1' # Fallback común en legacy asp

        soup = BeautifulSoup(resp.text, 'html.parser')
        payload = {}
        
        # 1. Hidden inputs (ViewState es lo más importante)
        for input_tag in soup.find_all("input"):
            name = input_tag.get("name")
            value = input_tag.get("value", "")
            if name: 
                payload[name] = value

        # 2. Selects (valores por defecto)
        for select_tag in soup.find_all("select"):
            name = select_tag.get("name")
            if name:
                option_selected = select_tag.find("option", selected=True)
                if option_selected:
                    payload[name] = option_selected.get("value", "")
                else:
                    options = select_tag.find_all("option")
                    if options:
                        payload[name] = options[0].get("value", "")
                    else:
                        payload[name] = ""
        return payload, soup, resp

    except Exception as e:
        print(f"[X] Error obteniendo payload: {e}")
        raise e

@app.post("/api/login")
def login(data: LoginRequest):
    users_db = cargar_usuarios()
    user = users_db.get(data.username)
    if not user: raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    password_provided = data.password.encode('utf-8')
    stored_hash = user["hashed_password"].encode('utf-8')

    if not bcrypt.checkpw(password_provided, stored_hash):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    return {"id": user["username"], "username": user["username"], "status": "active"}

@app.post("/api/buscar-producto")
def buscar_producto_detalle(data: BusquedaRequest):
    session = get_session()
    
    try:
        url_buscar = f"{BASE_URL}/producto/buscar.aspx"
        
        # PASO 1: GET Inicial (carga ViewState)
        payload, _, _ = obtener_payload_completo(session, url_buscar)
        
        # PASO 2: Preparar búsqueda
        # Aseguramos enviar SOLO lo que cambia + los campos de control
        payload["txtcodigo_bus"] = data.codigo
        payload["txttotal_registros_bus"] = "100"
        
        # TRUCO: A veces los servidores legacy chequean si el botón existe en el POST
        # aunque sea type="button". Lo agregamos por si acaso.
        payload["bt_buscar"] = "Buscar" 

        print(f"[*] Buscando código: {data.codigo}...")
        resp_busqueda = session.post(url_buscar, data=payload)
        resp_busqueda.encoding = 'latin-1' # Forzar encoding para ver bien tildes y ñ
        
        # PASO 3: Parseo ROBUSTO
        soup_tabla = BeautifulSoup(resp_busqueda.text, 'html.parser')
        
        # Buscar un enlace (<a>) que CONTENGA el código buscado en su texto o atributos
        # Esto es mucho más seguro que el regex ciego.
        target_link = None
        
        # Estrategia A: Buscar por texto exacto del enlace
        target_link = soup_tabla.find("a", string=lambda t: t and data.codigo.strip() in t)
        
        # Estrategia B: Si falla, buscar en todos los onclicks
        if not target_link:
            links_con_onclick = soup_tabla.find_all("a", onclick=True)
            for link in links_con_onclick:
                if data.codigo in link['onclick']:
                    target_link = link
                    break
        
        if not target_link:
            print("[!] Producto no encontrado. Guardando HTML de error para depuración...")
            # GUARDAR HTML PARA QUE PUEDAS VERLO
            with open("debug_ultimo_error.html", "w", encoding="utf-8") as f:
                f.write(resp_busqueda.text)
            print(" -> Archivo 'debug_ultimo_error.html' creado en la carpeta del backend.")
            return {"found": False, "message": "Producto no encontrado en RJC (Revisar logs)"}

        # Extraer ID del onclick
        onclick_text = target_link['onclick'] # Ej: modificar('780...','2560');
        print(f"[*] Link encontrado: {onclick_text}")
        
        # Regex más permisiva
        match = re.search(r"modificar\s*\(\s*['\"]?([^'\",]+)['\"]?\s*,\s*['\"]?([^'\",]+)['\"]?\s*\)", onclick_text)
        
        if not match:
             return {"found": False, "message": "Error leyendo ID del producto"}
             
        id_producto = match.group(2)
        print(f"[*] ID encontrado: {id_producto}. Accediendo a detalle...")

        # PASO 4: Transición a modificar.aspx (Cross-Page Post)
        url_modificar = f"{BASE_URL}/producto/modificar.aspx"
        
        # Reutilizamos el payload (tiene el ViewState correcto) y agregamos el ID
        payload["txtid_producto"] = id_producto
        
        resp_detalle = session.post(url_modificar, data=payload)
        resp_detalle.encoding = 'latin-1'
        soup_detalle = BeautifulSoup(resp_detalle.text, 'html.parser')

        # Helper de extracción
        def get_val(field_name):
            tag = soup_detalle.find("input", {"name": field_name})
            if tag: return tag.get("value", "")
            
            select = soup_detalle.find("select", {"name": field_name})
            if select:
                option = select.find("option", selected=True)
                if option: return option.get("value", "")
                
                # Fallback JS script
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
        sesion_global_rjc = None
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/guardar-producto")
def guardar_producto(data: ProductoForm):
    session = get_session()
    
    try:
        # 1. PRIMERO: Guardar en el servidor remoto (RJC Web)
        print("[*] Obteniendo contexto para guardar...")
        url_modificar = f"{BASE_URL}/producto/modificar.aspx"
        
        payload_refresh, _, _ = obtener_payload_completo(session, url_modificar, method="POST", data_prev={"txtid_producto": data.txtid_producto})
        
        payload_final = payload_refresh.copy()
        payload_final.update(data.dict())
        
        url_guardar = f"{BASE_URL}/producto/modificar_gra.aspx"
        print(f"[*] Guardando cambios remotos ID: {data.txtid_producto}...")
        
        resp_guardar = session.post(url_guardar, data=payload_final)
        
        remote_success = False
        if "Producto modificado" in resp_guardar.text:
            remote_success = True
        else:
            return {"success": False, "message": "RJC Remoto no confirmó la grabación"}

        # 2. SEGUNDO: Si remoto ok, sincronizar localmente
        local_msg = ""
        if remote_success:
            # Convertimos el modelo Pydantic a dict para pasarlo a la función local
            datos_dict = data.dict()
            local_ok = sincronizar_producto_local(datos_dict)
            
            if local_ok:
                local_msg = " y sincronizado localmente"
            else:
                local_msg = " (pero falló la copia local, revisa la consola)"

        return {"success": True, "message": f"Producto guardado correctamente{local_msg}"}

    except Exception as e:
        print(f"Error Guardando: {e}")
        sesion_global_rjc = None
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/api/obtener-subfamilias")
def obtener_subfamilias(data: dict):
    # Esperamos {"familia_id": "9"}
    familia_id = data.get("familia_id", "0")
    if not familia_id: familia_id = "0"

    session = get_session()
    
    try:
        # Replicamos la URL del JS antiguo: cargar_subfamilia.aspx?txtfamilia_producto=X
        url = f"{BASE_URL}/producto/cargar_subfamilia.aspx?txtfamilia_producto={familia_id}"
        print(f"[*] Buscando subfamilias para familia {familia_id}...")
        
        resp = session.get(url, timeout=10)
        resp.encoding = 'latin-1' # El XML suele venir en latin-1
        
        # Parseamos el XML
        soup = BeautifulSoup(resp.text, 'xml') # O 'html.parser' si falla xml
        
        subfamilias = []
        for fila in soup.find_all("fila"):
            # Extraemos ID y Nombre como indica el JS antiguo
            id_sub = fila.find("id_subfamilia").text
            nombre = fila.find("nombre").text
            subfamilias.append({"id": id_sub, "nombre": nombre})
            
        return {"subfamilias": subfamilias}

    except Exception as e:
        print(f"Error cargando subfamilias: {e}")
        raise HTTPException(status_code=500, detail=str(e))