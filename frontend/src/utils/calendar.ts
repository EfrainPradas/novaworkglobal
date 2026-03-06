export interface CalendarEvent {
    title: string;
    description: string;
    location?: string;
    startTime: Date;
    endTime: Date;
    organizer?: {
        name: string;
        email: string;
    };
    attendees?: Array<{
        name: string;
        email: string;
    }>;
}

/**
 * Generates an ICS file content string from event details
 */
export function generateICS(event: CalendarEvent): string {
    // Format date to ICS standard (YYYYMMDDTHHMMSSZ)
    const formatDate = (date: Date): string => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const now = formatDate(new Date());
    const start = formatDate(event.startTime);
    const end = formatDate(event.endTime);

    let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//NovaWork Global//Coaching Sessions//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `DTSTAMP:${now}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`
    ];

    if (event.location) {
        icsContent.push(`LOCATION:${event.location}`);
    }

    if (event.organizer) {
        icsContent.push(`ORGANIZER;CN=${event.organizer.name}:mailto:${event.organizer.email}`);
    }

    if (event.attendees && event.attendees.length > 0) {
        event.attendees.forEach(attendee => {
            icsContent.push(`ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${attendee.name}:mailto:${attendee.email}`);
        });
    }

    // Generate a random UID
    const uid = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}@novaworkglobal.com`;
    icsContent.push(`UID:${uid}`);
    icsContent.push('END:VEVENT');
    icsContent.push('END:VCALENDAR');

    return icsContent.join('\r\n');
}

/**
 * Triggers a download of the provided event as an .ics file
 */
export function downloadICS(event: CalendarEvent, filename: string = 'event.ics') {
    const icsContent = generateICS(event);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}
