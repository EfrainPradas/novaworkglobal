
# Proyecto de Analítica NovaWork Global

Este directorio contiene la configuración de **dbt (data build tool)** para analizar los datos de NovaWork Global.

## 1. Configuración Inicial

### Paso 1: Credenciales
Debes configurar tu conexión a la base de datos.
El archivo `profiles.yml` es una plantilla. 
*   **Opción A (Recomendada):** Mueve el contenido de `profiles.yml` a tu archivo global en `~/.dbt/profiles.yml` y llena los datos reales (host, user, password).
*   **Opción B (Local):** Edita el archivo `profiles.yml` aquí mismo con tus credenciales (¡Cuidado con subir contraseñas a Git! Agrega `analytics/profiles.yml` al .gitignore).

### Paso 2: Instalación de dependencias
Asegúrate de tener dbt instalado con el adaptador de Postgres:
```bash
pip install dbt-core dbt-postgres
```

Verifica la conexión:
```bash
dbt debug
```

## 2. Ejecutar Modelos

Para transformar los datos y crear las tablas de reporte:

```bash
dbt run
```

Esto creará/actualizará las tablas:
*   `analytics.stg_user_skills` (Vista limpia)
*   `analytics.top_skills_report` (Tabla de reporte)

## 3. Pruebas y Documentación

Para verificar que los datos estén limpios:
```bash
dbt test
```

Para generar y ver la documentación del linaje de datos:
```bash
dbt docs generate
dbt docs serve
```
