enum CartStatuses {
  OPEN = 'OPEN',
  STATUS = 'STATUS',
}

export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  count: number; //!!??? do we need it?
};

export type CartItemPopulated = {
  product: Product;
  count: number;
};

export type CartItem = {
  productId: string;
  count: number;
};

export type CartWithPopulatedItems = {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  status: CartStatuses;
  items: CartItemPopulated[];
};

export type Cart = {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  status: CartStatuses;
  items: CartItem[];
};
