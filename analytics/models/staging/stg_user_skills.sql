
with source as (
    -- Importamos la tabla cruda de la base de datos
    -- En un proyecto real, esto debería ser {{ source('public', 'user_skills') }}
    -- pero para simplificar sin configurar sources.yml aun, usamos la referencia directa si dbt tiene acceso
    select * from {{ source('public', 'user_skills') }}
),

cleaned as (
    select
        id as skill_id,
        user_id,
        -- Normalizamos el texto (trim espacios y minúsculas)
        lower(trim(skill_name)) as skill_name_clean,
        source as origin_source, -- renombramos para claridad
        created_at
    from source
    where skill_name is not null
)

select * from cleaned
