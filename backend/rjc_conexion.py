import requests
from bs4 import BeautifulSoup

# Constantes de URL
BASE_URL = "http://prod-gen.rjcfactura17.com"
LOGIN_URL = f"{BASE_URL}/login/login.aspx?idcliente=prod_f1578"
DESCONECTAR_PAGE_URL = f"{BASE_URL}/login/desconectar.aspx"
CERRAR_SESION_URL = f"{BASE_URL}/login/cerrar2.aspx"

def validar_sesion_activa(session):
    if not session: return False
        
    try:
        url_test = f"{BASE_URL}/frames.aspx"
        
        # Hacemos GET. Importante: no usar raise_for_status() para poder leer el error 500
        response = session.get(url_test, timeout=5)
        
        # CASO 1: El error específico de tu archivo (Sesión Muerta)
        if response.status_code == 500 or "Cannot use a leading" in response.text:
            print("[!] [RJC] Validación: Detectado error 500 en frames.aspx (Sesión caducada).")
            return False

        # CASO 2: Redirección al login estándar (por si arreglan el bug del servidor algún día)
        if "login.aspx" in response.url or "Ingresar al Sistema" in response.text:
            print("[!] [RJC] Validación: Redirección a login detectada.")
            return False
            
        # CASO 3: Éxito (Status 200 y sin errores conocidos)
        if response.status_code == 200:
            return True
            
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

        # CASO 1: Sesión ocupada (Necesita Kick)
        if "Numero maximo de usuario" in response.text:
            print("[!] [RJC] Sesión ocupada. Iniciando protocolo de desconexión...")
            
            # 1. Ir a la página de desconexión para ver quién está conectado
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
                # El valor "0" suele ser "Seleccione..." o vacío
                if valor and valor != "0":
                    usuario_a_patear = valor
                    print(f"[*] [RJC] Usuario encontrado para desconectar ID: {usuario_a_patear}")
                    break
            
            if not usuario_a_patear:
                print("[X] [RJC] No se encontró usuario activo para patear.")
                return None

            # 2. Enviar la orden de cierre
            payload_cerrar = {
                "txtuser_con": usuario_a_patear,
                "txtid_producto": "",
                "txtid_user": "3" # Valor fijo observado
            }
            
            s.post(CERRAR_SESION_URL, data=payload_cerrar)
            print("[*] [RJC] Orden de desconexión enviada. Reintentando login...")
            
            # 3. Reintento de login
            response_final = s.post(LOGIN_URL, data=payload_login)
            
            if "Numero maximo de usuario" not in response_final.text:
                print("[V] [RJC] ¡Login forzado EXITOSO!")
                return s
            else:
                print("[X] [RJC] Falló el segundo intento post-desconexión.")
                return None

        # CASO 2: Login limpio directo
        elif "Bienvenido" in response.text or response.status_code == 200: 
            print("[V] [RJC] Login exitoso directo.")
            return s
        
        # CASO 3: Credenciales malas u otro error
        else:
            print("[X] [RJC] Login fallido (credenciales incorrectas o error desconocido).")
            return None

    except Exception as e:
        print(f"[X] [RJC] Excepción de conexión: {e}")
        return None