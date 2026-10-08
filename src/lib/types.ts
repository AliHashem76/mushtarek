export type Settings = { provider_id: string; usd_rate: number; kwh_price_usd: number; base_generator_fee: number }

export type Subscriber = {
  id: string; provider_id: string; full_name: string; phone: string
  address_zone: string | null; address_building: string | null; address_floor: string | null
  has_generator: boolean; generator_type: 'meter' | 'flat' | null
  meter_number: string | null; last_meter_reading: number; generator_flat_price: number | null
  has_internet: boolean; internet_plan_name: string | null; internet_price: number | null
  has_satellite: boolean; satellite_price: number | null; is_active: boolean
}

export type Invoice = {
  id: string; provider_id: string; subscriber_id: string; billing_month: string
  prev_reading: number | null; curr_reading: number | null; kwh_consumed: number | null
  generator_amount: number; internet_amount: number; satellite_amount: number; previous_debt: number
  total_amount_usd: number; total_amount_lbp: number; status: 'unpaid' | 'paid'; created_at: string
}

export type SubscriberRow = Subscriber & { current: Invoice | null; debt: number }

export type ProviderRow = {
  id: string; business_name: string; owner_name: string; phone: string
  subscription_status: 'active' | 'suspended'; expires_at: string | null
  monthly_fee_usd: number; created_at: string; subscribers: { count: number }[]
}
