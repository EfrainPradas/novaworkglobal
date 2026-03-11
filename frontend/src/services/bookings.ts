import { supabase } from '@/lib/supabase'
import { createBookingAcceptedNotifications } from './notifications'

export const acceptBooking = async (bookingId: string) => {
    // 1. Fetch the booking with coach and client profiles joined
    const { data: booking, error: fetchError } = await supabase
        .from('coaching_sessions')
        .select(`
            *,
            coach:profiles!coaching_sessions_coach_id_fkey(id, full_name, first_name, last_name, timezone),
            client:profiles!coaching_sessions_client_id_fkey(id, full_name, first_name, last_name, timezone)
        `)
        .eq('id', bookingId)
        .single();

    if (fetchError || !booking) {
        console.error("Error fetching booking for acceptance:", fetchError);
        throw new Error("Could not fetch the booking details.");
    }

    // Since Supabase might return arrays for joins depending on the relation, we will extract them
    // Assuming single relations because of foreign keys.
    const coachProfile = Array.isArray(booking.coach) ? booking.coach[0] : booking.coach;
    const clientProfile = Array.isArray(booking.client) ? booking.client[0] : booking.client;

    if (!coachProfile || !clientProfile) {
        throw new Error("Missing coach or client profile data to generate notifications.");
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
        await createBookingAcceptedNotifications(booking, coachProfile, clientProfile);
    } catch (notifError) {
        console.error("Booking accepted, but failed to create notifications:", notifError);
        // We don't necessarily throw here if we don't want to roll back the acceptance, 
        // but it's good to log it.
    }

    return booking;
};
