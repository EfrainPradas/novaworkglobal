import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function updateTier() {
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, subscription_tier')
    .or('email.ilike.%awoodw%,id.eq.e8b5435e-c15c-48c3-b472-871c5ec6e578'); // Random check + common email pattern

  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  console.log('Found users:', users);

  if (users && users.length > 0) {
    const user = users[0];
    console.log(`Updating user ${user.email} (${user.id}) to executive...`);
    const { error: updateError } = await supabase
      .from('users')
      .update({ subscription_tier: 'executive' })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating tier:', updateError);
    } else {
      console.log('Success! Tier updated to executive.');
    }
  } else {
    console.log('No user found matching the criteria.');
  }
}

updateTier();
