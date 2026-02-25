
select
    id as value_id,
    user_id,
    value_id as value_code, -- e.g. 'work_life_balance'
    lower(trim(value_label)) as value_label, -- e.g. 'Work Life Balance'
    created_at
from {{ source('public', 'user_values') }}
