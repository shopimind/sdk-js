export interface SpmCustomDataFieldDef {
  name: string;
  label: string;
  type: 'bool' | 'text' | 'longtext' | 'number' | 'decimal' | 'list' | 'date' | 'datetime' | 'json' | 'geolocation';
  description?: string;
  required: boolean;
  default?: unknown;
  options?: Array<string | number>;
}

export interface SpmCustomDataRelationshipDef {
  sourceField: string;
  targetSchemaType: 'system' | 'custom';
  targetSchema: string;
  targetField?: string;
}

export interface SpmCreateCustomDataDefinitionData {
  name: string;
  description?: string;
  unique_keys?: string[];
  fields: SpmCustomDataFieldDef[];
  relationships?: SpmCustomDataRelationshipDef[];
}

export interface SpmExtendCustomDataDefinitionData {
  name?: string;
  description?: string;
  fields?: SpmCustomDataFieldDef[];
  relationships?: SpmCustomDataRelationshipDef[];
}

export interface SpmFieldOverrideQuery {
  target_system_schema: 'products';
  system_field_name: 'price' | 'price_discount';
}

export interface SpmFieldOverrideItem {
  id_custom_data_definition: number;
  custom_field_name: string;
  priority: number;
}

/** A custom data record value. Relation fields accept a direct id or a resolver object. */
export type SpmCustomDataRecord = Record<
  string,
  unknown | { by: 'id_contact' | 'email' | 'id_customer'; value: unknown }
>;
