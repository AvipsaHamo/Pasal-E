import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../core/services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
  <div class="cart-page">
    <h1 class="cart-title">Cart</h1>

    @if (cartSvc.items().length === 0) {
      <div class="empty-cart">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        <p>Your cart is empty.</p>
        <a class="shop-btn" routerLink="/products">Browse Products</a>
      </div>
    } @else {
      <div class="cart-items">
        @for (item of cartSvc.items(); track item.productId) {
          <div class="cart-item">
            <div class="item-img-wrap">
              @if (item.image) {
                <img [src]="item.image" [alt]="item.name" />
              } @else {
                <div class="item-img-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
              }
            </div>

            <div class="item-info">
              <p class="item-name">{{ item.name }}</p>
              @if (item.variationName) {
                <p class="item-variant">Variant: {{ item.variationName }}</p>
              }
              <div class="qty-row">
                <button class="qty-btn" (click)="decrement(item.productId, item.variationId)">−</button>
                <span class="qty-num">{{ item.quantity }}</span>
                <button class="qty-btn" (click)="increment(item.productId, item.variationId)">+</button>
              </div>
            </div>

            <div class="item-right">
              <p class="item-price">{{ formatPrice(item.price * item.quantity) }}</p>
              <button class="remove-btn" (click)="remove(item.productId, item.variationId)" title="Remove item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          </div>
        }
      </div>
    }

    @if (cartSvc.items().length > 0) {
      <div class="cart-footer">
        <div class="footer-inner">
          <div class="total-row">
            <span class="total-label">Total</span>
            <span class="total-amount">{{ formatPrice(cartSvc.subtotal()) }}</span>
          </div>
          <a class="checkout-btn" routerLink="/checkout">Checkout</a>
        </div>
      </div>
    }
  </div>
  `,
  styleUrls: ['./cart.component.css']
})
export class CartComponent {
  constructor(public cartSvc: CartService) {}

  increment(productId: number, variationId?: number): void {
    this.cartSvc.updateQty(productId, variationId, 1);
  }

  decrement(productId: number, variationId?: number): void {
    this.cartSvc.updateQty(productId, variationId, -1);
  }

  remove(productId: number, variationId?: number): void {
    this.cartSvc.removeItem(productId, variationId);
  }

  formatPrice(n: number): string { return `Rs. ${n.toLocaleString()}`; }
}
