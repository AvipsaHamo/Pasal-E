import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../core/services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.component.html',
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
