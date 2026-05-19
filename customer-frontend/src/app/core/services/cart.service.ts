// customer-frontend/src/app/core/services/cart.service.ts
import { Injectable, signal, computed } from '@angular/core';

export interface CartItem {
  productId:     number;
  name:          string;
  image?:        string;
  price:         number;
  quantity:      number;
  variationId?:  number;
  variationName?: string;
}

const CART_KEY = 'pasale_cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _items = signal<CartItem[]>(this.loadFromStorage());

  readonly items    = this._items.asReadonly();
  readonly count    = computed(() => this._items().reduce((s, i) => s + i.quantity, 0));
  readonly subtotal = computed(() =>
    this._items().reduce((s, i) => s + i.price * i.quantity, 0));

  addItem(item: Omit<CartItem, 'quantity'>, qty = 1): void {
    this._items.update(current => {
      const key = this.itemKey(item.productId, item.variationId);
      const existing = current.find(i => this.itemKey(i.productId, i.variationId) === key);
      let updated: CartItem[];
      if (existing) {
        updated = current.map(i =>
          this.itemKey(i.productId, i.variationId) === key
            ? { ...i, quantity: i.quantity + qty }
            : i
        );
      } else {
        updated = [...current, { ...item, quantity: qty }];
      }
      this.persist(updated);
      return updated;
    });
  }

  updateQty(productId: number, variationId: number | undefined, delta: number): void {
    this._items.update(current => {
      const key = this.itemKey(productId, variationId);
      const updated = current
        .map(i => this.itemKey(i.productId, i.variationId) === key
          ? { ...i, quantity: Math.max(0, i.quantity + delta) }
          : i)
        .filter(i => i.quantity > 0);
      this.persist(updated);
      return updated;
    });
  }

  removeItem(productId: number, variationId: number | undefined): void {
    this._items.update(current => {
      const key = this.itemKey(productId, variationId);
      const updated = current.filter(i => this.itemKey(i.productId, i.variationId) !== key);
      this.persist(updated);
      return updated;
    });
  }

  clear(): void {
    this._items.set([]);
    localStorage.removeItem(CART_KEY);
  }

  private itemKey(productId: number, variationId?: number): string {
    return `${productId}-${variationId ?? 'none'}`;
  }

  private persist(items: CartItem[]): void {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }

  private loadFromStorage(): CartItem[] {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }
}
