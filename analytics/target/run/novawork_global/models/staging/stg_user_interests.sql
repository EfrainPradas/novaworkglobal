
  create view "postgres"."public_staging"."stg_user_interests__dbt_tmp"
    
    
  as (
    select
    id as interest_id,
    user_id,
    lower(trim(interest_name)) as interest_name,
    created_at
from "postgres"."public"."user_interests"
where interest_name is not null
  );