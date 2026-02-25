/**
 * Contact Profile API Routes
 * Handles CRUD for user contact information (resume header)
 */

import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { supabaseAdmin as supabase } from '../services/supabase.js'

const router = express.Router()

// 🔒 Require authentication
router.use(requireAuth)

/**
 * GET /api/contact-profile
 * Returns current user's contact profile
 */
router.get('/contact-profile', async (req, res) => {
    try {
        const userId = req.user.id

        const { data, error } = await supabase
            .from('user_contact_profile')
            .select('*')
            .eq('user_id', userId)
            .single()

        if (error && error.code !== 'PGRST116') throw error

        return res.json({
            success: true,
            data: data || null
        })
    } catch (error) {
        console.error('Error fetching contact profile:', error)
        res.status(500).json({ error: 'Failed to fetch contact profile' })
    }
})

/**
 * GET /api/contact-profile/complete
 * Returns whether the user's contact info is complete
 */
router.get('/contact-profile/complete', async (req, res) => {
    try {
        const userId = req.user.id

        const { data, error } = await supabase
            .from('user_contact_profile')
            .select('contact_info_complete')
            .eq('user_id', userId)
            .single()

        if (error && error.code !== 'PGRST116') throw error

        return res.json({
            complete: data?.contact_info_complete || false
        })
    } catch (error) {
        console.error('Error checking contact completeness:', error)
        res.status(500).json({ error: 'Failed to check contact completeness' })
    }
})

/**
 * PUT /api/contact-profile
 * Upserts contact profile with validation
 */
router.put('/contact-profile', async (req, res) => {
    try {
        const userId = req.user.id
        const {
            first_name, middle_name, last_name,
            phone, email,
            address_line1, address_line2,
            country, state, city, postal_code,
            linkedin_url, portfolio_url
        } = req.body

        // Validate required fields
        const errors = []
        if (!first_name?.trim()) errors.push('First name is required')
        if (!last_name?.trim()) errors.push('Last name is required')
        if (!email?.trim()) errors.push('Email is required')

        if (errors.length > 0) {
            return res.status(400).json({ error: 'Validation failed', details: errors })
        }

        // Determine completeness
        const contact_info_complete = !!(
            first_name?.trim() &&
            last_name?.trim() &&
            phone?.trim() &&
            country?.trim() &&
            state?.trim() &&
            city?.trim()
        )

        const profileData = {
            user_id: userId,
            first_name: first_name?.trim() || '',
            middle_name: middle_name?.trim() || null,
            last_name: last_name?.trim() || '',
            phone: phone ? String(phone).trim() : '',
            email: email?.trim() || '',
            address_line1: address_line1?.trim() || null,
            address_line2: address_line2?.trim() || null,
            country: country?.trim() || '',
            state: state?.trim() || '',
            city: city?.trim() || '',
            postal_code: postal_code?.trim() || null,
            linkedin_url: linkedin_url?.trim() || null,
            portfolio_url: portfolio_url?.trim() || null,
            contact_info_complete
        }

        const { data, error } = await supabase
            .from('user_contact_profile')
            .upsert(profileData, { onConflict: 'user_id' })
            .select()
            .single()

        if (error) throw error

        console.log(`✅ Contact profile saved for user ${userId} (complete: ${contact_info_complete})`)

        return res.json({
            success: true,
            data
        })
    } catch (error) {
        console.error('Error saving contact profile:', error)
        res.status(500).json({ error: 'Failed to save contact profile' })
    }
})

export default router
