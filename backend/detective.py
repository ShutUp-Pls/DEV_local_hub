import re
from bs4 import BeautifulSoup
from rjc_conexion import obtener_sesion_rjc, BASE_URL

# Credenciales
RJC_EMAIL = "darien.oportobrandt@gmail.com"
RJC_CLAVE = "372619"

def buscar_ruta_real():
    print("🕵️ INICIANDO DETECTIVE DE RUTAS RJC...")
    
    # 1. Login
    session = obtener_sesion_rjc(RJC_EMAIL, RJC_CLAVE)
    if not session:
        print("❌ No se pudo iniciar sesión. Revisa credenciales.")
        return

    # 2. Obtener el marco principal (frames.aspx)
    url_frames = f"{BASE_URL}/frames.aspx"
    print(f"[*] Analizando marcos en: {url_frames}")
    resp = session.get(url_frames)
    soup = BeautifulSoup(resp.text, 'html.parser')

    frames = soup.find_all("frame")
    url_menu = None

    # Buscamos el frame que parece ser el menú (izquierda o top)
    for frame in frames:
        src = frame.get("src")
        name = frame.get("name")
        print(f"   -> Frame encontrado: Nombre='{name}' | SRC='{src}'")
        
        # Usualmente el menú está en un frame llamado 'leftFrame', 'menu', 'toc', etc.
        # O si el src contiene 'menu' o 'arbol'
        if src and ("menu" in src.lower() or "left" in src.lower() or "arbol" in src.lower()):
            url_menu = src

    if not url_menu:
        print("⚠️ No detecté el frame del menú automáticamente. Intentando ruta común '/login/menu.aspx'...")
        url_menu = "login/menu.aspx" # Fallback común

    # 3. Analizar el Menú para encontrar "Productos"
    # Asegurar ruta absoluta
    if not url_menu.startswith("http"):
        # Limpieza de ruta relativa
        url_menu = url_menu.lstrip("/")
        # Si estaba en login/frames.aspx, el relativo puede ser directo
        if "login" in url_menu:
            full_menu_url = f"{BASE_URL}/{url_menu}"
        else:
            full_menu_url = f"{BASE_URL}/login/{url_menu}"
    else:
        full_menu_url = url_menu

    print(f"[*] Descargando menú de: {full_menu_url}")
    try:
        resp_menu = session.get(full_menu_url)
        soup_menu = BeautifulSoup(resp_menu.text, 'html.parser')
        
        # Buscamos enlaces que digan "Producto" o "Productos"
        links = soup_menu.find_all("a")
        found = False
        
        print("\n🔍 BUSCANDO ENLACE 'PRODUCTOS' EN EL MENÚ:")
        for link in links:
            text = link.get_text(strip=True)
            href = link.get("href")
            
            # Filtramos enlaces vacíos o de javascript puro sin url
            if href and "javascript" not in href.lower() and ("producto" in text.lower()):
                print(f"   ✅ ¡ENCONTRADO! Texto: '{text}' -> URL: {href}")
                found = True
            elif href and "buscar.aspx" in href.lower():
                 print(f"   ✅ ¡POSIBLE CANDIDATO! (Contiene buscar.aspx) -> URL: {href}")
                 found = True
        
        if not found:
            print("\n❌ No encontré la palabra 'Productos' en los enlaces del menú.")
            print("   Listando los primeros 10 enlaces encontrados para dar pistas:")
            for i, link in enumerate(links[:10]):
                print(f"   - {link.get_text(strip=True)} -> {link.get('href')}")

    except Exception as e:
        print(f"❌ Error leyendo menú: {e}")

if __name__ == "__main__":
    buscar_ruta_real()