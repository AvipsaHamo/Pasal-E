import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { DestroyableComponent } from '../../core/base/destroyable.base';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html'
})
export class LoginComponent extends DestroyableComponent {
  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  loading  = false;
  errorMsg = '';

  constructor(
    private fb:     FormBuilder,
    private auth:   AuthService,
    private router: Router
  ) { super(); }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true; this.errorMsg = '';

    const email    = this.form.value.email    ?? '';
    const password = this.form.value.password ?? '';

    this.auth.login({ email, password })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.loading = false;
          this.router.navigate(res.needsShopSetup ? ['/setup-shop'] : ['/dashboard']);
        },
        error: (err: { error?: { message?: string } }) => {
          this.loading  = false;
          this.errorMsg = err?.error?.message ?? 'Login failed. Please try again.';
        }
      });
  }
}
