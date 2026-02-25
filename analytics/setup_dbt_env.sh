
#!/bin/bash
# Script para configurar las variables de entorno de dbt
# Uso: source setup_dbt_env.sh

echo "Configurando entorno para dbt..."


# ASEGURAR QUE DBT ESTÁ EN EL PATH
export PATH=$PATH:$HOME/.local/bin

# La contraseña de tu base de datos Supabase (¡No la compartas!)
# Si no la recuerdas, puedes resetearla en Project Settings -> Database -> Password
export DB_PASSWORD="Pr@d4.2026.**"

echo "✅ Variable DB_PASSWORD exportada."
echo "Ahora puedes ejecutar 'dbt debug' para probar la conexión."
