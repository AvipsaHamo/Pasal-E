export interface OrderListItem {
  orderId:      number;
  customerName: string;
  phone?:       string;
  orderDate:    string;
  status:       string;
}

export interface OrderDetailLine {
  productId?:    number;
  productName?:  string;
  variationName?: string;
  quantity:      number;
  price?:        number;
}

export interface OrderFull {
  orderId:      number;
  customerName: string;
  phone?:       string;
  email?:       string;
  address?:     string;
  landmark?:    string;
  orderDate:    string;
  status:       string;
  totalAmount?: number;
  details:      OrderDetailLine[];
}
