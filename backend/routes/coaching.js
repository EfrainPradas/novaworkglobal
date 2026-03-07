import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Initialize Supabase with Service Role Key to bypass RLS
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Create a coaching session
router.post('/sessions', async (req, res) => {
    try {
        const { coach_id, client_id, session_type, scheduled_at, duration_minutes, status } = req.body;

        if (!coach_id || !client_id || !scheduled_at) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // 1. Ensure the coach_clients relationship exists
        let coachClientId;
        const { data: existingRels, error: searchError } = await supabase
            .from('coach_clients')
            .select('id')
            .eq('coach_id', coach_id)
            .eq('client_id', client_id)
            .limit(1);

        if (searchError) {
            console.error("Error searching relations:", searchError);
            return res.status(500).json({ error: searchError.message });
        }

        if (existingRels && existingRels.length > 0) {
            coachClientId = existingRels[0].id;
        } else {
            const { data: newRel, error: relError } = await supabase
                .from('coach_clients')
                .insert([{
                    coach_id: coach_id,
                    client_id: client_id,
                    status: 'active'
                }])
                .select()
                .single();

            if (relError) {
                console.error("Error creating relation:", relError);
                return res.status(500).json({ error: relError.message });
            }
            coachClientId = newRel.id;
        }

        // 2. Insert the coaching session
        const { data: session, error: sessionError } = await supabase
            .from('coaching_sessions')
            .insert([{
                coach_client_id: coachClientId,
                coach_id: coach_id,
                client_id: client_id,
                session_type: session_type || 'Career Vision Review',
                scheduled_at: scheduled_at,
                duration_minutes: duration_minutes || 60,
                status: status || 'pending'
            }])
            .select()
            .single();

        if (sessionError) {
            console.error("Error inserting session:", sessionError);
            return res.status(500).json({ error: sessionError.message });
        }

        res.status(200).json({ message: 'Session booked successfully', session });
    } catch (error) {
        console.error('Booking error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update a coaching session (e.g., to cancel it)
router.patch('/sessions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'Missing status property' });
        }

        const { data: session, error: sessionError } = await supabase
            .from('coaching_sessions')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (sessionError) {
            console.error("Error updating session:", sessionError);
            return res.status(500).json({ error: sessionError.message });
        }

        res.status(200).json({ message: 'Session updated successfully', session });
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
