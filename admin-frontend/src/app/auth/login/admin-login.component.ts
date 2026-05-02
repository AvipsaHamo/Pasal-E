// admin-frontend/src/app/auth/login/admin-login.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminAuthService } from '../../core/services/admin-auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.css'
})
export class AdminLoginComponent {
  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  loading  = false;
  errorMsg = '';

  constructor(
    private fb:     FormBuilder,
    private auth:   AdminAuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading  = true;
    this.errorMsg = '';

    const { email, password } = this.form.value;
    this.auth.login({ email: email!, password: password! }).subscribe({
      next:  () => { this.loading = false; this.router.navigate(['/shops']); },
      error: (err: { error?: { message?: string } }) => {
        this.loading  = false;
        this.errorMsg = err?.error?.message ?? 'Login failed.';
      }
    });
  }
}
