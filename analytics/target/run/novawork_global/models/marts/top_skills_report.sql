
  
    

  create  table "postgres"."public_analytics"."top_skills_report__dbt_tmp"
  
  
    as
  
  (
    with skills as (
    -- Referenciamos el modelo anterior
    select * from "postgres"."public_staging"."stg_user_skills"
),

aggregated as (
    select
        skill_name_clean as skill,
        count(distinct user_id) as total_users,
        
        -- Calculamos porcentaje del total de usuarios
        count(distinct user_id) * 100.0 / (select count(distinct user_id) from skills) as percentage_popularity
        
    from skills
    group by 1
)

select 
    skill,
    total_users,
    round(percentage_popularity, 2) as popularity_percent
from aggregated
order by total_users desc
limit 20
  );
  