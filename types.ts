
export interface Product {
  id: string;
  name: string;
  description: string;
  category: 'sofa' | 'poltrona' | 'chaise' | 'puff' | 'cama';
  price: number;
  colors: string[];
  fabrics: string[];
  dimensions: string;
  images: string[];
  active: boolean;
  created_at: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedColor?: string;
  selectedFabric?: string;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_city: string;
  items: CartItem[];
  total_price: number;
  notes: string;
  created_at: string;
}

export interface AppSettings {
  id: string;
  store_name: string;
  whatsapp_number: string;
  contact_email: string;
  contact_address: string;
  hours_mon_fri: string;
  hours_sat: string;
  primary_color: string;
  secondary_color: string;
  updated_at: string;
}

export type Category = 'todos' | 'sofa' | 'poltrona' | 'chaise' | 'puff' | 'cama';
