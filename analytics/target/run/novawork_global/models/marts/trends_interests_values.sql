
  
    

  create  table "postgres"."public_analytics"."trends_interests_values__dbt_tmp"
  
  
    as
  
  (
    with interests as (
    select interest_name, count(distinct user_id) as count
    from "postgres"."public_staging"."stg_user_interests"
    group by 1
),

values as (
    select value_label, count(distinct user_id) as count
    from "postgres"."public_staging"."stg_user_values"
    group by 1
)

select 'Interest' as type, interest_name as name, count
from interests
union all
select 'Value' as type, value_label as name, count
from values
order by count desc
  );
  