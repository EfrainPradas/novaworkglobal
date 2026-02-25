
#!/bin/bash
set -e

# 1. Check for pip, install if missing
if ! python3 -m pip --version > /dev/null 2>&1; then
    echo "⬇️  Pip no encontrado. Descargando instalador..."
    wget -q https://bootstrap.pypa.io/get-pip.py -O get-pip.py
    echo "⬇️  Ejecutando get-pip.py..."
    python3 get-pip.py --break-system-packages --user
    rm get-pip.py
fi

# 2. Add local bin to PATH for this session
export PATH=$PATH:$HOME/.local/bin

# 3. Install dbt if missing
if ! python3 -m dbt --version > /dev/null 2>&1; then
    echo "⬇️  Instalando dbt..."
    python3 -m pip install --user dbt-core dbt-postgres --break-system-packages
fi

# 4. Go to project dir
cd $HOME/novaworkglobal/analytics

# 5. Load env
source setup_dbt_env.sh

# 6. Run debug
echo "📡 Ejecutando dbt debug..."
python3 -m dbt debug --profiles-dir .
