import { supabase } from '../../lib/supabase'
import type { Store } from '../../types/database'

export const storeService = {
  async getStoresForOrganization(organizationId: string): Promise<Store[]> {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('name')
    if (error) throw error
    return data || []
  },

  async createStore(
    organizationId: string,
    name: string,
    code: string,
    address?: string,
    phone?: string
  ): Promise<Store> {
    const { data, error } = await supabase
      .from('stores')
      .insert({
        organization_id: organizationId,
        name,
        code: code.toUpperCase(),
        address: address || null,
        phone: phone || null,
        is_active: true,
      })
      .select()
      .single()
    if (error) throw error
    return data
  },
}
