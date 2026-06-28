import type { SpmDataSourceAttributes } from './common.js';

/* ── Shop connection ── */
export interface SpmShopConnectionData {
  shop_id?: string;
  default_currency: string;
  default_lang: string;
  langs: string[];
  timezone: string;
  url_client: string;
  ecommerce_version: string;
  module_version: string;
}

/* ── Customers ── */
export interface SpmCustomerData extends SpmDataSourceAttributes {
  customer_id: string;
  shop_id?: string | null;
  email: string;
  phone_number?: string | null;
  first_name: string;
  last_name: string;
  birth_date?: string | null;
  is_opt_in: boolean;
  is_newsletter_subscribed: boolean;
  lang: string;
  group_ids?: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SpmCustomerAddressData extends SpmDataSourceAttributes {
  address_id: number;
  first_name: string;
  last_name: string;
  primary_phone?: string | null;
  secondary_phone?: string | null;
  company?: string | null;
  address_line_1: string;
  address_line_2?: string | null;
  postal_code: string;
  city: string;
  country: string;
  is_active: boolean;
}

export interface SpmBulkCustomerAddressData extends SpmCustomerAddressData {
  customer_id: string;
}

export interface SpmCustomerGroupData extends SpmDataSourceAttributes {
  group_id: string;
  shop_id?: string | null;
  lang: string;
  name: string;
  created_at: string;
  updated_at: string;
}

/* ── Newsletter subscribers ── */
export interface SpmNewsletterSubscriberData {
  shop_id?: string | null;
  email: string;
  is_subscribed: boolean;
  first_name: string;
  last_name: string;
  postal_code: string;
  lang: string;
  updated_at: string;
}

/* ── Products ── */
export interface SpmProductData extends SpmDataSourceAttributes {
  product_id: number;
  shop_id?: string | null;
  lang: string;
  name: string;
  reference?: string | null;
  ean13?: string | null;
  description: string;
  description_short?: string | null;
  link: string;
  image_link?: string | null;
  category_ids?: number[] | null;
  manufacturer_id?: string | null;
  currency: string;
  price: number;
  price_discount?: number | null;
  quantity_remaining: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SpmProductCategoryData extends SpmDataSourceAttributes {
  category_id: number;
  shop_id?: string | null;
  lang: string;
  name: string;
  description: string;
  parent_category_id?: number | null;
  link: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SpmProductImageData extends SpmDataSourceAttributes {
  image_id: string;
  lang: string;
  variation_id?: number | null;
  url: string;
  is_default: boolean;
}

export interface SpmBulkProductImageData extends SpmProductImageData {
  product_id: string;
}

export interface SpmProductManufacturerData extends SpmDataSourceAttributes {
  manufacturer_id: string;
  shop_id?: string | null;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SpmProductVariationData extends SpmDataSourceAttributes {
  variation_id: number;
  name: string;
  lang: string;
  reference?: string | null;
  ean13?: string | null;
  link: string;
  image_link?: string | null;
  price: number;
  price_discount?: number | null;
  quantity_remaining: number;
  is_default: boolean;
}

export interface SpmBulkProductVariationData extends SpmProductVariationData {
  product_id: string;
}

/* ── Orders ── */
export interface SpmOrderProduct {
  product_id: number;
  product_variation_id?: number | null;
  price: number;
  price_without_tax: number;
  manufacturer_id?: string | null;
  quantity: number;
}

export interface SpmOrderCustomer {
  customer_id: string;
  email: string;
  created_at: string;
}

export interface SpmOrderData extends SpmDataSourceAttributes {
  order_id: string;
  shop_id?: string | null;
  lang: string;
  reference?: string | null;
  carrier_id?: string | null;
  status_id: string;
  address_delivery_id?: string | null;
  address_invoice_id?: string | null;
  customer: SpmOrderCustomer;
  products: SpmOrderProduct[];
  cart_id: string;
  cart_updated_at: string;
  amount: number;
  amount_without_tax: number;
  shipping_costs: number;
  shipping_costs_without_tax: number;
  shipping_number?: string | null;
  currency: string;
  voucher_used?: string | null;
  voucher_value?: string | null;
  is_confirmed: boolean;
  created_at: string;
  updated_at: string;
}

export interface SpmOrderCarrierData extends SpmDataSourceAttributes {
  carrier_id: string;
  shop_id?: string | null;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SpmOrderStatusData extends SpmDataSourceAttributes {
  status_id: string;
  shop_id?: string | null;
  lang: string;
  name: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

/* ── Vouchers ── */
export interface SpmVoucherData extends SpmDataSourceAttributes {
  voucher_id: string;
  shop_id?: string | null;
  lang: string;
  code: string;
  description: string;
  started_at: string;
  ended_at?: string | null;
  customer_id?: string | null;
  type_voucher: 'free_shipping' | 'amount_reduction' | 'percentage_reduction';
  value?: number | null;
  minimum_amount: number;
  currency: string;
  reduction_tax: boolean;
  is_used: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
