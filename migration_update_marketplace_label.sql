-- Migration: Update Marketplace label to "Ewidencja Sprzedaży"
-- Changes the display name in sidebar navigation
-- This updates the label in the navigation_items table

-- Update by path (more reliable than ID, as ID might be generated differently)
UPDATE public.navigation_items
SET label = 'Ewidencja Sprzedaży'
WHERE path = '/dashboard/marketplace' AND label = 'Marketplace';

-- Also update by ID if it exists
UPDATE public.navigation_items
SET label = 'Ewidencja Sprzedaży'
WHERE id = 'dashboard-marketplace' AND label = 'Marketplace';

-- Verify the update
-- SELECT id, label, path FROM public.navigation_items WHERE path = '/dashboard/marketplace';
