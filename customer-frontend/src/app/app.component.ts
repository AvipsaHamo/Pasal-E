import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CustomerNavbarComponent } from './navbar/customer-navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CustomerNavbarComponent],
  template: `
    <app-customer-navbar />
    <router-outlet />
  `
})
export class AppComponent {}
