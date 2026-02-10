import requests
import json

from fastapi import HTTPException
from pydantic import BaseModel
from typing import Optional
from bs4 import BeautifulSoup

# Constantes de URL
BASE_URL = "http://prod-gen.rjcfactura17.com"
LOGIN_URL = f"{BASE_URL}/login/login.aspx?idcliente=prod_f1578"
DESCONECTAR_PAGE_URL = f"{BASE_URL}/login/desconectar.aspx"
CERRAR_SESION_URL = f"{BASE_URL}/login/cerrar2.aspx"

RJC_EMAIL = "darien.oportobrandt@gmail.com"
RJC_CLAVE = "372619"
sesion_global_rjc = None

HEADERS_NAVEGADOR = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
    "Connection": "keep-alive"
}

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

def get_session():
    global sesion_global_rjc
    if sesion_global_rjc:
        sesion_global_rjc.headers.update(HEADERS_NAVEGADOR)
        if validar_sesion_activa(sesion_global_rjc):
            return sesion_global_rjc
        else:
            sesion_global_rjc = None

    session = obtener_sesion_rjc(RJC_EMAIL, RJC_CLAVE)
    if session:
        session.headers.update(HEADERS_NAVEGADOR)
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
        if method == "GET": resp = session.get(url, timeout=15)
        else: resp = session.post(url, data=data_prev, timeout=15)
            
        if 'charset=' in resp.headers.get('content-type', '').lower(): resp.encoding = resp.encoding
        else: resp.encoding = 'latin-1'

        soup = BeautifulSoup(resp.text, 'html.parser')
        payload = {}

        for input_tag in soup.find_all("input"):
            name = input_tag.get("name")
            value = input_tag.get("value", "")
            if name: payload[name] = value

        for select_tag in soup.find_all("select"):
            name = select_tag.get("name")
            if name:
                option_selected = select_tag.find("option", selected=True)
                if option_selected: payload[name] = option_selected.get("value", "")
                else:
                    options = select_tag.find_all("option")
                    if options: payload[name] = options[0].get("value", "")
                    else: payload[name] = ""

        return payload, soup, resp

    except Exception as e:
        print(f"[X] Error obteniendo payload: {e}")
        raise e

def validar_sesion_activa(session):
    if not session: return False
        
    try:
        url_test = f"{BASE_URL}/frames.aspx"
        response = session.get(url_test, timeout=5)

        if response.status_code == 500 or "Cannot use a leading" in response.text:
            print("[!] [RJC] Validación: Detectado error 500 en frames.aspx (Sesión caducada).")
            return False

        if "login.aspx" in response.url or "Ingresar al Sistema" in response.text:
            print("[!] [RJC] Validación: Redirección a login detectada.")
            return False

        if response.status_code == 200: return True

        return False

    except Exception as e:
        print(f"[!] Error validando sesión en frames.aspx: {e}")
        return False

def obtener_sesion_rjc(email: str, clave: str):
    s = requests.Session()

    payload_login = {
        "txtemail": email,
        "txtclave": clave,
        "btningresar": "Ingresar"
    }

    try:
        print(f"[*] [RJC] Intentando conectar con {email}...")
        response = s.post(LOGIN_URL, data=payload_login, timeout=10)

        if "Numero maximo de usuario" in response.text:
            print("[!] [RJC] Sesión ocupada. Iniciando protocolo de desconexión...")

            resp_desc = s.post(DESCONECTAR_PAGE_URL, data=payload_login)
            soup = BeautifulSoup(resp_desc.text, 'html.parser')
            
            select_box = soup.find("select", {"id": "txtuser_con"})
            if not select_box:
                print("[X] [RJC] No se pudo encontrar el selector de usuarios.")
                return None

            options = select_box.find_all("option")
            
            usuario_a_patear = None
            for opt in options:
                valor = opt.get("value")
                if valor and valor != "0":
                    usuario_a_patear = valor
                    print(f"[*] [RJC] Usuario encontrado para desconectar ID: {usuario_a_patear}")
                    break
            
            if not usuario_a_patear:
                print("[X] [RJC] No se encontró usuario activo para patear.")
                return None

            payload_cerrar = {
                "txtuser_con": usuario_a_patear,
                "txtid_producto": "",
                "txtid_user": "3"
            }
            
            s.post(CERRAR_SESION_URL, data=payload_cerrar)
            print("[*] [RJC] Orden de desconexión enviada. Reintentando login...")

            response_final = s.post(LOGIN_URL, data=payload_login)
            
            if "Numero maximo de usuario" not in response_final.text:
                print("[V] [RJC] ¡Login forzado EXITOSO!")
                return s
            else:
                print("[X] [RJC] Falló el segundo intento post-desconexión.")
                return None

        elif "Bienvenido" in response.text or response.status_code == 200: 
            print("[V] [RJC] Login exitoso directo.")
            return s

        else:
            print("[X] [RJC] Login fallido (credenciales incorrectas o error desconocido).")
            return None

    except Exception as e:
        print(f"[X] [RJC] Excepción de conexión: {e}")
        return None