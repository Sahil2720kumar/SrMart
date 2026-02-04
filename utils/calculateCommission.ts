import { supabase } from '@/lib/supabase';

// Calculate commission for a single product
const calculateCommission = async (productId: string) => {
  const { data, error } = await supabase.rpc('calculate_product_commission', {
    p_product_id: productId
  });

  if (error) {
    console.error('Commission calculation error:', error);
    return null;
  }

  return data; // Returns commission rate (e.g., 10.50)
};

export {calculateCommission}