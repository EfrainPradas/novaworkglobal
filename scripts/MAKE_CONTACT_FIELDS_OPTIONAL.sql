-- Fix for 500 error when saving Contact Info with empty optional fields
-- Run this script in the Supabase SQL Editor

ALTER TABLE public.user_contact_profile ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.user_contact_profile ALTER COLUMN country DROP NOT NULL;
ALTER TABLE public.user_contact_profile ALTER COLUMN state DROP NOT NULL;
ALTER TABLE public.user_contact_profile ALTER COLUMN city DROP NOT NULL;
