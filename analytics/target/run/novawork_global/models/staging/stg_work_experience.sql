
  create view "postgres"."public_staging"."stg_work_experience__dbt_tmp"
    
    
  as (
    select
    we.id as experience_id,
    ur.user_id,
    we.job_title,
    we.company_name,
    
    -- Manejo robusto de fechas (YYYY-MM -> YYYY-MM-01)
    cast(
        case 
            when we.start_date = '' then null
            when length(we.start_date) = 7 then we.start_date || '-01'
            else we.start_date 
        end as date
    ) as start_date_clean,

    cast(
        case 
            when we.end_date = '' then null
            when length(we.end_date) = 7 then we.end_date || '-01'
            else we.end_date 
        end as date
    ) as end_date_clean,

    we.is_current,
    
    -- Calcular duración
    case 
        when we.is_current then (current_date - cast(
            case 
                when we.start_date = '' then null
                when length(we.start_date) = 7 then we.start_date || '-01'
                else we.start_date 
            end as date
        ))
        when we.end_date != '' then (
            cast(
                case 
                    when we.end_date = '' then null
                    when length(we.end_date) = 7 then we.end_date || '-01'
                    else we.end_date 
                end as date
            ) - cast(
                case 
                    when we.start_date = '' then null
                    when length(we.start_date) = 7 then we.start_date || '-01'
                    else we.start_date 
                end as date
            )
        )
        else 0
    end as duration_days,
    
    we.created_at
from "postgres"."public"."work_experience" we
left join "postgres"."public"."user_resumes" ur 
    on we.resume_id = ur.id
where we.start_date is not null 
  and we.start_date != ''
  );