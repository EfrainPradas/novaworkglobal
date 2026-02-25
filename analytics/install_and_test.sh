
#!/bin/bash
set -e

echo "🚀 Iniciando configuración de entorno dbt..."

# 1. Crear entorno virtual si no existe
if [ ! -d "venv" ]; then
    echo "📦 Creando virtualenv..."
    python3 -m venv venv
fi

# 2. Activar entorno
echo "🔌 Activando entorno..."
source venv/bin/activate

# 3. Instalar dbt
echo "⬇️  Instalando dbt-postgres..."
pip install -q dbt-core dbt-postgres

# 4. Cargar variables de entorno (contraseña)
if [ -f "setup_dbt_env.sh" ]; then
    echo "🔑 Cargando credenciales..."
    source setup_dbt_env.sh
else
    echo "⚠️  No se encontró setup_dbt_env.sh"
    exit 1
fi

# 5. Probar conexión
echo "📡 Probando conexión con dbt debug..."
dbt debug --profiles-dir .

echo "✅ ¡Todo listo!"
