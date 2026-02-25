
select
    id as interest_id,
    user_id,
    lower(trim(interest_name)) as interest_name,
    created_at
from {{ source('public', 'user_interests') }}
where interest_name is not null
