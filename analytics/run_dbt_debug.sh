
#!/bin/bash
# 1. Instalar dbt si no está
python3 -m pip install --user dbt-core dbt-postgres

# 2. Asegurar que está en el PATH
export PATH=$PATH:$HOME/.local/bin

# 3. Ir al directorio correcto
cd $HOME/novaworkglobal/analytics

# 4. Cargar credenciales
source setup_dbt_env.sh

# 5. Ejecutar debug
echo "Corriendo dbt debug..."
python3 -m dbt debug --profiles-dir .
