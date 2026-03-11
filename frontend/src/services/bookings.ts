import { supabase } from '@/lib/supabase'
import { createBookingAcceptedNotifications } from './notifications'

export const acceptBooking = async (bookingId: string) => {
    // 1. Fetch the booking alone
    const { data: booking, error: fetchError } = await supabase
        .from('coaching_sessions')
        .select('*')
        .eq('id', bookingId)
        .single();

    if (fetchError || !booking) {
        console.error("Error fetching booking for acceptance:", fetchError);
        throw new Error("Could not fetch the booking details.");
    }

    // 1.5 Fetch coach and client details directly from the users table 
    // using maybeSingle() to avoid 406 Not Acceptable errors if missing.
    const { data: coachProfile } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('id', booking.coach_id)
        .maybeSingle();

    const { data: clientProfile } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('id', booking.client_id)
        .maybeSingle();

    if (!coachProfile || !clientProfile) {
        console.warn("Could not find full profiles for coach or client. Proceeding carefully.");
    }

    // 2. Update the booking status to "confirmed" (business logic equates this to accepted)
    const { error: updateError } = await supabase
        .from('coaching_sessions')
        .update({ status: 'confirmed' }) // In DB we use confirmed/scheduled
        .eq('id', bookingId);

    if (updateError) {
        throw updateError;
    }

    // 3. Generate notifications and Calendar links
    try {
        // Provide fallback identities if users table lookup was incomplete
        await createBookingAcceptedNotifications(
            booking, 
            coachProfile || { id: booking.coach_id, full_name: 'Coach' }, 
            clientProfile || { id: booking.client_id, full_name: 'Client' }
        );
    } catch (notifError) {
        console.error("Booking accepted, but failed to create notifications:", notifError);
        // We don't necessarily throw here if we don't want to roll back the acceptance, 
        // but it's good to log it.
    }

    return booking;
};
