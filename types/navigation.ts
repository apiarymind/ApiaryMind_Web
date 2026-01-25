export type NavigationItem = {
  id: string;
  label: string;
  path: string;
  icon_name?: string | null;
  allowed_roles: string[];
  category: string | null;
  sort_order: number;
  is_active: boolean;
};
