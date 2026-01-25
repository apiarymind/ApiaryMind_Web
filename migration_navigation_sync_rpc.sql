-- Ensure icon_name column exists
ALTER TABLE public.navigation_items
  ADD COLUMN IF NOT EXISTS icon_name TEXT;

-- RPC function to sync navigation items via SECURITY DEFINER
DROP FUNCTION IF EXISTS public.sync_navigation_items(JSONB);
CREATE OR REPLACE FUNCTION public.sync_navigation_items(items JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item JSONB;
  item_path TEXT;
  item_label TEXT;
  item_icon TEXT;
  item_section TEXT;
  item_required_role TEXT;
  item_sort_order INT;
  item_id TEXT;
  default_roles TEXT[] := ARRAY['FREE','PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'];
BEGIN
  IF items IS NULL THEN
    RETURN;
  END IF;

  -- Replace all navigation items with the payload
  DELETE FROM public.navigation_items;

  FOR item IN SELECT * FROM jsonb_array_elements(items)
  LOOP
    item_path := COALESCE(item->>'path', '');
    IF item_path = '' THEN
      CONTINUE;
    END IF;

    item_label := COALESCE(item->>'label', item_path);
    item_icon := item->>'icon_name';
    item_section := item->>'section';
    item_required_role := item->>'required_role';
    item_sort_order := NULLIF(item->>'sort_order', '')::INT;
    item_id := 'nav-' || regexp_replace(item_path, '\W+', '-', 'g');

    INSERT INTO public.navigation_items (
      id,
      label,
      path,
      icon_name,
      category,
      allowed_roles,
      sort_order,
      is_active
    )
    VALUES (
      item_id,
      item_label,
      item_path,
      item_icon,
      item_section,
      CASE
        WHEN item_required_role IS NOT NULL AND item_required_role <> '' THEN ARRAY[item_required_role]
        ELSE default_roles
      END,
      COALESCE(item_sort_order, 0),
      TRUE
    )
    ON CONFLICT (path) DO UPDATE
    SET
      label = EXCLUDED.label,
      icon_name = EXCLUDED.icon_name;
  END LOOP;
END;
$$;
