#!/bin/bash
set -e

# Redirect stdout and stderr to a log file
LOG_FILE="install_log.txt"
exec > >(tee -i $LOG_FILE)
exec 2>&1

echo "🛠️  Fixing dbt installation..."
echo "Timestamp: $(date)"

# Removing broken venv
if [ -d "venv" ]; then
    echo "🗑️  Removing existing venv..."
    rm -rf venv
fi

# Creating new venv
echo "📦 Creating new virtual environment..."
python3 -m venv venv

# Activate
source venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install dbt
echo "⬇️  Installing dbt-core and dbt-postgres..."
pip install dbt-core dbt-postgres

echo "✅ Installation complete."
echo "Running version check:"
dbt --version
