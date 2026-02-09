import json
import bcrypt

def crear_usuarios():
    usuarios_raw = [
        {"username": "admin", "password": "password123"},
        {"username": "usuario1", "password": "mi_secreto"},
    ]

    usuarios_db = {}
    
    print("Generando usuarios...")
    for user in usuarios_raw:
        salt = bcrypt.gensalt()
        hashed_pw = bcrypt.hashpw(user["password"].encode('utf-8'), salt)
        
        usuarios_db[user["username"]] = {
            "username": user["username"],
            "hashed_password": hashed_pw.decode('utf-8')
        }
    
    with open("users_db.json", "w") as f: json.dump(usuarios_db, f, indent=4)
    print("✅ Archivo users_db.json creado exitosamente.")

if __name__ == "__main__":
    crear_usuarios()