import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../core/services/cart.service';
import { CustomerShopService } from '../core/services/shop.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './checkout.component.html',
    styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent {
  placing   = false;
  placed    = false;
  orderId   = 0;
  error     = '';

  form = this.fb.group({
    firstName:   ['', Validators.required],
    lastName:    ['', Validators.required],
    phone:       ['', [Validators.required, Validators.pattern(/^[0-9+\s-]{7,15}$/)]],
    email:       [''],
    address:     ['', Validators.required],
    landmark:    [''],
    paymentType: ['', Validators.required]
  });

  constructor(
    private fb:      FormBuilder,
    private cartSvc: CartService,
    private shopSvc: CustomerShopService,
    private router:  Router
  ) {}

  get items()    { return this.cartSvc.items(); }
  get subtotal() { return this.cartSvc.subtotal(); }

  formatPrice(n: number): string { return `Rs. ${n.toLocaleString()}`; }

  onPlaceOrder(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (this.items.length === 0) { this.error = 'Your cart is empty.'; return; }

    this.placing = true; this.error = '';
    const v = this.form.value;

    this.shopSvc.placeOrder({
      firstName:   v.firstName   ?? '',
      lastName:    v.lastName    ?? '',
      phone:       v.phone       ?? '',
      email:       v.email       || undefined,
      address:     v.address     ?? '',
      landmark:    v.landmark    || undefined,
      paymentType: v.paymentType ?? '',
      items: this.items.map(i => ({
        productId:    i.productId,
        variationId:  i.variationId,
        quantity:     i.quantity,
        price:        i.price,
        productName:  i.name,
        variationName: i.variationName
      }))
    }).subscribe({
      next: res => {
        this.placing = false;
        this.placed  = true;
        this.orderId = res.orderId;
        this.cartSvc.clear();
      },
      error: (err: { error?: { message?: string } }) => {
        this.placing = false;
        this.error   = err?.error?.message ?? 'Failed to place order. Please try again.';
      }
    });
  }
}
