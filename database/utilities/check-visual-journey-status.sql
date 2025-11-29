-- ============================================================================
-- Check Visual Journey Implementation Status
-- ============================================================================
-- Run this to see what's already in your database

-- 1. Check if columns exist
SELECT 
    'Column Check' as check_type,
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sobriety_trackers' 
AND column_name IN ('chosen_image', 'piece_unlock_order', 'current_phase', 'pieces_unlocked', 'total_pieces', 'days_per_piece')
ORDER BY column_name;

-- 2. Check if tracker_relapses table exists
SELECT 
    'Table Check' as check_type,
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'tracker_relapses';

-- 3. Check if trigger exists
SELECT 
    'Trigger Check' as check_type,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table = 'sobriety_trackers'
AND trigger_name = 'enforce_chosen_image_lock';

-- 4. Check if function exists
SELECT 
    'Function Check' as check_type,
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'prevent_chosen_image_change';

-- 5. Check existing trackers
SELECT 
    'Tracker Data' as check_type,
    id,
    tracker_name,
    chosen_image,
    CASE 
        WHEN piece_unlock_order IS NULL THEN 'NULL'
        ELSE 'Set (' || array_length(piece_unlock_order, 1) || ' pieces)'
    END as unlock_order,
    is_active
FROM public.sobriety_trackers
ORDER BY created_at DESC
LIMIT 5;

-- 6. Summary
SELECT 
    'Summary' as info,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = 'sobriety_trackers' AND column_name = 'piece_unlock_order') as has_unlock_order_column,
    (SELECT COUNT(*) FROM information_schema.triggers 
     WHERE trigger_name = 'enforce_chosen_image_lock') as has_image_lock_trigger,
    (SELECT COUNT(*) FROM public.sobriety_trackers WHERE piece_unlock_order IS NOT NULL) as trackers_with_unlock_order,
    (SELECT COUNT(*) FROM public.sobriety_trackers WHERE is_active = true) as active_trackers;
