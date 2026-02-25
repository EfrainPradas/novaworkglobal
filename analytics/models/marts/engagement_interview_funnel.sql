
select
    funnel_status as status,
    count(distinct interview_id) as total_interviews,
    count(distinct user_id) as active_users
from {{ ref('stg_interviews') }}
group by 1
order by total_interviews desc
