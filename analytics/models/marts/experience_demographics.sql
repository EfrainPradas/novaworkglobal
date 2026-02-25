
with user_experience as (
    select 
        user_id,
        sum(duration_days) / 365.0 as total_years_experience,
        count(experience_id) as roles_held
    from {{ ref('stg_work_experience') }}
    group by 1
)

select 
    case 
        when total_years_experience < 2 then 'Junior (0-2y)'
        when total_years_experience < 5 then 'Mid (2-5y)'
        when total_years_experience < 10 then 'Senior (5-10y)'
        else 'Expert (10y+)'
    end as seniority_level,
    count(user_id) as user_count,
    avg(roles_held) as avg_roles
from user_experience
group by 1
order by user_count desc
