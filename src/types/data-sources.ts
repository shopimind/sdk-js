export interface SpmDataSourceData {
  id_data_source: number;
  id_shop?: number;
  label: string;
  type?: string;
  is_default?: boolean;
  config?: string | null;
  active?: boolean;
  parent_id?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface SpmCreateDataSourceData {
  label: string;
  type?: string;
  config?: string | Record<string, unknown> | null;
  parent_id?: number | null;
  is_default?: boolean;
}

export interface SpmIntegratorConfigValues {
  values: Record<string, string>;
}
