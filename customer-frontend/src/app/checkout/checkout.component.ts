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
  template: `
  <div class="checkout-page">

    <!-- Order placed success -->
    @if (placed) {
      <div class="success-screen">
        <div class="success-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h2 class="success-title">Order Placed!</h2>
        <p class="success-sub">Your order #{{ orderId }} has been received by the shop.</p>
        <div class="detail-footer success-detail-footer">
          <div class="customer-info">
            <p><strong>Customer:</strong> {{ form.value.firstName }} {{ form.value.lastName }}</p>
            <p><strong>Phone:</strong> {{ form.value.phone }}</p>
            <p><strong>Address:</strong> {{ form.value.address }}</p>
            <p><strong>Payment Method:</strong> {{ form.value.paymentType }}</p>
          </div>
        </div>
        <a class="continue-btn" routerLink="/">Continue Shopping</a>
      </div>
    } @else {

      <div class="checkout-layout">
        <!-- ── Left: form ── -->
        <div class="form-col">
          <div class="back-row">
            <a class="back-btn" routerLink="/cart">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
            </a>
            <h1 class="page-title">Checkout</h1>
          </div>

          <!-- Contact -->
          <h2 class="section-title">Contact Information</h2>
          <div class="name-row">
            <div class="field-group">
              <label>First Name</label>
              <input type="text" placeholder="Name" [formControl]="form.controls.firstName"
                [class.invalid]="form.controls.firstName.invalid && form.controls.firstName.touched" />
            </div>
            <div class="field-group">
              <label>Last Name</label>
              <input type="text" placeholder="Name" [formControl]="form.controls.lastName"
                [class.invalid]="form.controls.lastName.invalid && form.controls.lastName.touched" />
            </div>
          </div>
          <div class="field-group">
            <label>Phone Number</label>
            <input type="tel" placeholder="Name" [formControl]="form.controls.phone"
              [class.invalid]="form.controls.phone.invalid && form.controls.phone.touched" />
          </div>
          <div class="field-group">
            <label>Email</label>
            <input type="email" placeholder="Name" [formControl]="form.controls.email" />
          </div>

          <!-- Delivery -->
          <h2 class="section-title" style="margin-top:24px;">Delivery Information</h2>
          <div class="field-group">
            <label>Address</label>
            <input type="text" placeholder="Name" [formControl]="form.controls.address"
              [class.invalid]="form.controls.address.invalid && form.controls.address.touched" />
          </div>
          <div class="field-group">
            <label>Landmark</label>
            <input type="text" placeholder="Name" [formControl]="form.controls.landmark" />
          </div>

          <!-- Payment -->
          <h2 class="section-title" style="margin-top:24px;">Payment Method</h2>
          <div class="payment-options">
            <label class="payment-option">
              <input type="radio" [formControl]="form.controls.paymentType" value="Cash on Delivery" />
              <span class="radio-box"></span>
              Cash On Delivery
            </label>
            <label class="payment-option">
              <input type="radio" [formControl]="form.controls.paymentType" value="Online Payment" />
              <span class="radio-box"></span>
              Online Payment
            </label>
          </div>
          @if (form.controls.paymentType.invalid && form.controls.paymentType.touched) {
            <p class="field-error">Please select a payment method.</p>
          }
        </div>

        <!-- ── Right: order summary ── -->
        <div class="summary-col">
          <h2 class="summary-title">Order Summary</h2>
          <div class="summary-card">
            <div class="summary-items">
              @for (item of items; track item.productId) {
                <div class="summary-item">
                  <div class="summary-item-info">
                    <span class="s-name">{{ item.name }}</span>
                    @if (item.variationName) {
                      <span class="s-variant">{{ item.variationName }}</span>
                    }
                    <span class="s-qty">× {{ item.quantity }}</span>
                  </div>
                  <span class="s-price">Rs. {{ (item.price * item.quantity).toLocaleString() }}</span>
                </div>
              }
            </div>
            <div class="summary-divider"></div>
            <div class="summary-total-row">
              <span class="total-label">Total</span>
              <span class="total-val">Rs. {{ subtotal.toLocaleString() }}</span>
            </div>
            @if (error) {
              <div class="order-error">{{ error }}</div>
            }
            <button class="place-order-btn" (click)="onPlaceOrder()" [disabled]="placing">
              {{ placing ? 'Placing Order...' : 'Place Order' }}
            </button>
          </div>
        </div>
      </div>
    }
  </div>
  `,
  styles: [
`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

.checkout-page {
  padding: 40px 60px 60px;
  background: var(--c-bg-page, #f2f8f0);
  min-height: 100vh;
  font-family: 'Poppins', sans-serif;
}

.success-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 16px;
  text-align: center;
}
.success-icon {
  width: 80px; height: 80px;
  background: var(--c-primary-muted, #e8f3e6);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
.success-icon svg { width: 40px; height: 40px; stroke: var(--c-primary, #4a7c3f); }
.success-title { font-size: 28px; font-weight: 700; color: var(--c-text-primary, #111); }
.success-sub   { font-size: 15px; color: var(--c-text-secondary, #4a7c3f); }
.continue-btn  {
  padding: 12px 28px;
  background: var(--c-primary, #4a7c3f);
  color: var(--c-text-on-primary, #fff);
  border-radius: 10px;
  font-family: 'Poppins', sans-serif;
  font-size: 14px; font-weight: 600;
  text-decoration: none;
  transition: opacity 0.18s;
  margin-top: 8px;
}
.continue-btn:hover { opacity: 0.85; }

.checkout-layout {
  display: grid;
  grid-template-columns: 1fr 480px;
  gap: 48px;
  align-items: start;
}
@media (max-width: 900px) {
  .checkout-layout { grid-template-columns: 1fr; }
  .checkout-page   { padding: 20px 20px 90px; }
}

.back-row { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
.back-btn {
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 50%;
  background: none; border: none; cursor: pointer;
  text-decoration: none; transition: background 0.15s;
}
.back-btn:hover { background: var(--c-primary-muted, #e8f3e6); }
.back-btn svg   { width: 22px; height: 22px; stroke: var(--c-text-primary, #111); }
.page-title     { font-size: 28px; font-weight: 700; color: var(--c-text-secondary, #4a7c3f); }

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--c-text-secondary, #4a7c3f);
  margin-bottom: 16px;
}

.name-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.field-group { margin-bottom: 14px; }
.field-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--c-text-primary, #333);
  margin-bottom: 6px;
}
.field-group input {
  width: 100%;
  padding: 12px 16px;
  background: var(--c-bg-card, #fff);
  border: 1.5px solid var(--c-border, #d0d0d0);
  border-radius: 28px;
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  color: var(--c-text-primary, #111);
  outline: none;
  transition: border-color 0.2s;
}
.field-group input:focus   { border-color: var(--c-primary, #4a7c3f); }
.field-group input.invalid { border-color: #c0392b; }
.field-group input::placeholder { color: #b0b8a0; }
.field-error { font-size: 12px; color: #c0392b; margin-top: -10px; margin-bottom: 10px; }

.payment-options { display: flex; flex-direction: column; gap: 14px; margin-bottom: 6px; }
.payment-option {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  color: var(--c-text-primary, #111);
  user-select: none;
}
.payment-option input[type="radio"] { display: none; }
.radio-box {
  width: 22px; height: 22px;
  border: 2px solid var(--c-border, #ccc);
  border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s, border-color 0.15s;
}
.payment-option input:checked + .radio-box {
  background: var(--c-primary, #4a7c3f);
  border-color: var(--c-primary, #4a7c3f);
}
.payment-option input:checked + .radio-box::after {
  content: '';
  width: 5px; height: 9px;
  border: 2px solid #fff;
  border-top: none; border-left: none;
  transform: rotate(45deg) translateY(-1px);
  display: block;
}

.summary-title { font-size: 22px; font-weight: 700; color: var(--c-text-secondary, #4a7c3f); margin-bottom: 16px; }

.summary-card {
  background: var(--c-bg-card, #fff);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

.summary-items { display: flex; flex-direction: column; gap: 12px; min-height: 160px; }
.summary-item  { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.summary-item-info { display: flex; flex-direction: column; gap: 2px; }
.s-name    { font-size: 14px; font-weight: 600; color: var(--c-text-primary, #111); }
.s-variant { font-size: 12px; color: var(--c-text-secondary, #555); }
.s-qty     { font-size: 12px; color: #888; }
.s-price   { font-size: 14px; font-weight: 600; color: var(--c-text-primary, #111); white-space: nowrap; }

.summary-divider { height: 1px; background: var(--c-border, #e0e0e0); margin: 16px 0; }

.summary-total-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.total-label { font-size: 16px; font-weight: 500; color: var(--c-text-primary, #111); }
.total-val   { font-size: 22px; font-weight: 800; color: var(--c-text-primary, #111); }

.detail-footer {
  margin-bottom: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--c-border, #e0e0e0);
}

.success-detail-footer {
  width: 100%;
  max-width: 420px;
  text-align: left;
}

.customer-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.customer-info p {
  font-size: 14px;
  color: var(--c-text-primary, #111);
  margin: 0;
  font-weight: 500;
}

.customer-info strong {
  font-weight: 700;
}

.order-error {
  background: rgba(192,57,43,.08);
  border: 1.5px solid #c0392b;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  color: #c0392b;
  font-weight: 600;
  margin-bottom: 14px;
}

.place-order-btn {
  display: block;
  width: 100%;
  padding: 16px;
  background: #111;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-family: 'Poppins', sans-serif;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s;
}
.place-order-btn:hover:not(:disabled) { background: #333; }
.place-order-btn:disabled { background: #999; cursor: not-allowed; }

:host-context(html[data-theme='dark']) .place-order-btn {
  background: #ffffff;
  color: #111827;
}
:host-context(html[data-theme='dark']) .place-order-btn:hover:not(:disabled) {
  background: #f3f4f6;
}
:host-context(html[data-theme='dark']) .place-order-btn:disabled {
  background: #6b7280;
  color: #e5e7eb;
}
`]
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
