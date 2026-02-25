
  create view "postgres"."public_staging"."stg_interviews__dbt_tmp"
    
    
  as (
    select
    i.id as interview_id,
    ja.user_id,
    ja.application_status,
    i.outcome,
    case 
        when i.outcome is not null then i.outcome
        when ja.application_status is not null then ja.application_status
        else 'Scheduled' 
    end as funnel_status,
    i.interview_date,
    i.created_at
from "postgres"."public"."interviews" i
left join "postgres"."public"."job_applications" ja 
    on i.job_application_id = ja.id
  );