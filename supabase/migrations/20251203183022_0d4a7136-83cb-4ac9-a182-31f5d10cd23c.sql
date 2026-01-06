-- Phase 1.1: Add 'vendor_admin' role to app_role enum
-- This must be in a separate transaction from functions that use it
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vendor_admin';