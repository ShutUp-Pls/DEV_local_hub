import subprocess
import os

def export_mdb_structure(file_path, output_txt="estructura_mdb.txt"):
    try:
        tables_cmd = subprocess.run(
            ['mdb-tables', '-1', file_path],
            capture_output=True, text=True,
            check=True
        )
        tables = tables_cmd.stdout.strip().split('\n')
        
        with open(output_txt, 'w', encoding='utf-8') as f:
            f.write(f"ESTRUCTURA DEL ARCHIVO: {os.path.basename(file_path)}\n")
            f.write("="*50 + "\n")

            for table in tables:
                if not table or table.startswith('MSys'): continue

                schema_cmd = subprocess.run(['mdb-schema', file_path, '--table', table], 
                                             capture_output=True, text=True, check=True)
                
                f.write(f"\nTABLA: {table}\n")
                f.write("-" * (len(table) + 7) + "\n")
                
                lines = schema_cmd.stdout.split('\n')
                for line in lines:
                    clean_line = line.strip()
                    if clean_line and not clean_line.startswith(('--', 'CREATE', 'DROP', ')', 'ALTER', 'Text')):
                        f.write(f"  {clean_line}\n")
                
                f.write("\n")

        print(f"✅ Estructura exportada con éxito a: {output_txt}")

    except subprocess.CalledProcessError as e: print(f"❌ Error al ejecutar mdbtools: {e}")
    except FileNotFoundError: print("❌ Error: mdbtools no está instalado. Ejecuta 'sudo apt install mdbtools'")

ruta_mdb = '/home/shutuppls/Documentos/rjc_prod_f1578.mdb' 
export_mdb_structure(ruta_mdb)