import { supabase } from './supabase'

const SESSION_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes in milliseconds
const DEDUP_MS = 2000 // 2 seconds to avoid React Strict Mode double-firing

let currentSessionId = ''
let lastEvent: { name: string, time: number, step?: string } | null = null;

if (typeof window !== 'undefined') {
    currentSessionId = localStorage.getItem('rb_session_id') || ''
    const lastActive = localStorage.getItem('rb_session_last_active')

    // Check if session expired
    if (!currentSessionId || !lastActive || (Date.now() - parseInt(lastActive)) > SESSION_TIMEOUT_MS) {
        currentSessionId = crypto.randomUUID()
        localStorage.setItem('rb_session_id', currentSessionId)
        localStorage.setItem('rb_session_started_steps', JSON.stringify([])) // Clear sequence memory on new session
        localStorage.setItem('rb_session_completed_steps', JSON.stringify([])) // Clear completed memory
    }

    // Update last active
    localStorage.setItem('rb_session_last_active', Date.now().toString())
}

export const trackEvent = async (
    category: 'analytics' | 'observability' | 'audit',
    eventName: string,
    properties: Record<string, any> = {},
    entityType?: string,
    entityId?: string
) => {
    // Deduplicate exact same events firing too close together (React Strict Mode fix)
    const now = Date.now();
    if (lastEvent &&
        lastEvent.name === eventName &&
        lastEvent.step === properties?.step_name &&
        (now - lastEvent.time) < DEDUP_MS) {
        return; // Skip duplicate
    }

    // Global lock for step events (survives React unmounts AND page reloads within the same session)
    if ((eventName === 'step_started' || eventName === 'step_completed') && properties?.step_name && typeof window !== 'undefined') {
        try {
            const storageKey = eventName === 'step_started' ? 'rb_session_started_steps' : 'rb_session_completed_steps'
            const storedStr = localStorage.getItem(storageKey) || '[]'
            const storedList = JSON.parse(storedStr) as string[]

            if (storedList.includes(properties.step_name)) {
                return; // Already logged this event for this step in this browser session
            }

            storedList.push(properties.step_name)
            localStorage.setItem(storageKey, JSON.stringify(storedList))
        } catch (e) { /* ignore parse errors */ }
    }

    lastEvent = { name: eventName, time: now, step: properties?.step_name };

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Update session timeout rule on every event
        if (typeof window !== 'undefined') {
            const lastActive = localStorage.getItem('rb_session_last_active')
            if (!lastActive || (Date.now() - parseInt(lastActive)) > SESSION_TIMEOUT_MS) {
                // Session expired mid-flight, rotate it
                currentSessionId = crypto.randomUUID()
                localStorage.setItem('rb_session_id', currentSessionId)
            }
            localStorage.setItem('rb_session_last_active', Date.now().toString())
        }

        // Fire and forget (don't await in UI components to avoid blocking)
        supabase.from('event_logs').insert({
            user_id: user.id,
            session_id: currentSessionId,
            event_category: category,
            event_name: eventName,
            target_entity_type: entityType,
            target_entity_id: entityId,
            event_properties: properties,
            user_agent: navigator.userAgent
        }).then(({ error }) => {
            if (error) console.error('Telemetry error:', error)
        })
    } catch (e) {
        // Failsafe: Logging should never break the app
        console.warn('Failed to log event', e)
    }
}
