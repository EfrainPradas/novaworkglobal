import { supabase } from '@/lib/supabase'
import { generateGoogleCalendarLink } from '@/utils/calendar'

export interface BookingDetails {
    id: string;
    session_type: string;
    scheduled_at: string;
    duration_minutes?: number;
    meeting_link?: string;
}

export interface UserProfile {
    id: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    timezone?: string;
}

const getFullName = (profile: UserProfile) => {
    if (profile.full_name) return profile.full_name;
    if (profile.first_name || profile.last_name) return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    return 'User';
}

/**
 * Creates "Booking Accepted" notifications for both Coach and Client with a Google Calendar CTA
 */
export const createBookingAcceptedNotifications = async (
    booking: BookingDetails,
    coachProfile: UserProfile,
    clientProfile: UserProfile
) => {
    const coachName = getFullName(coachProfile);
    const clientName = getFullName(clientProfile);
    const timezoneText = coachProfile.timezone ? `\nTimezone reference: ${coachProfile.timezone}` : '';
    const locationText = booking.meeting_link ? `\nMeeting Link: ${booking.meeting_link}` : '\nLocation: Online';

    // 1. Generate Google Calendar URL
    const description = `Coaching Session between ${coachName} (Coach) and ${clientName} (Client).\n\nSession Type: ${booking.session_type}${locationText}${timezoneText}`;

    const calendarUrl = generateGoogleCalendarLink({
        title: `Coaching: ${booking.session_type} with ${coachName}`,
        startDate: booking.scheduled_at,
        durationMinutes: booking.duration_minutes || 60,
        description: description,
        location: booking.meeting_link || 'Online'
    });

    // 2. Prepare notifications array
    const notifications = [
        {
            user_id: coachProfile.id,
            booking_id: booking.id,
            type: 'booking_accepted',
            title: 'Booking Accepted',
            message: `You accepted the booking with ${clientName}. Add this session to Google Calendar.`,
            action_label: 'Add to Google Calendar',
            action_url: calendarUrl
        },
        {
            user_id: clientProfile.id,
            booking_id: booking.id,
            type: 'booking_accepted',
            title: 'Booking Accepted',
            message: `${coachName} accepted your booking. Add this session to Google Calendar.`,
            action_label: 'Add to Google Calendar',
            action_url: calendarUrl
        }
    ];

    // 3. Insert into Supabase
    const { error } = await supabase.from('notifications').insert(notifications);
    
    if (error) {
        console.error('Error creating accepted booking notifications:', error);
        throw error;
    }
};
