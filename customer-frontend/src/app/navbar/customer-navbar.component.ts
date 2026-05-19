import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CustomerShopService } from '../core/services/shop.service';
import { CartService } from '../core/services/cart.service';

@Component({
  selector: 'app-customer-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './customer-navbar.component.html',
  styleUrl: './customer-navbar.component.css'
})
export class CustomerNavbarComponent {
  constructor(
    public shopSvc: CustomerShopService,
    public cartSvc: CartService
  ) {}
}
