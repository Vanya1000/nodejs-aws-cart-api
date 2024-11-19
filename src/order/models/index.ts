export enum OrderStatus {
  Open = 'OPEN',
  Approved = 'APPROVED',
  Confirmed = 'CONFIRMED',
  Sent = 'SENT',
  Completed = 'COMPLETED',
  Cancelled = 'CANCELLED',
}

export interface Payment {
  method: string;
}

export interface Delivery {
  address: string;
  firstName: string;
  lastName: string;
  comment?: string;
}

export interface Order {
  id: string;
  userId: string;
  cartId: string;
  payment: Payment;
  delivery: Delivery;
  comments?: string;
  status: OrderStatus;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}
