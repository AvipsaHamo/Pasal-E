// src/app/auth/after-signup/after-signup.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, map, switchMap, catchError, of, Observable } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-after-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './after-signup.component.html'
})
export class AfterSignupComponent {
  readonly subdomainSuffix = environment.subdomainSuffix;

  form = this.fb.group({
    brandName: ['', Validators.required],
    subdomain: ['', [
      Validators.required,
      Validators.minLength(3),
      Validators.pattern(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/)
    ]]
  });

  loading  = false;
  errorMsg = '';

  constructor(
    private fb:     FormBuilder,
    private auth:   AuthService,
    private router: Router,
    private http:   HttpClient
  ) {}

  // Auto-fill subdomain from brand name
  onBrandNameInput(event: Event): void {
    const val      = (event.target as HTMLInputElement).value;
    const slug     = val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const subdCtrl = this.form.get('subdomain');
    if (subdCtrl && !subdCtrl.dirty) {
      subdCtrl.setValue(slug, { emitEvent: true });
    }
  }

  onSubdomainInput(event: Event): void {
    const val  = (event.target as HTMLInputElement).value;
    const slug = val.toLowerCase().replace(/[^a-z0-9-]/g, '');
    this.form.get('subdomain')!.setValue(slug, { emitEvent: false });
    (event.target as HTMLInputElement).value = slug;
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading  = true;
    this.errorMsg = '';

    const { brandName, subdomain } = this.form.value;
    this.auth.setupShop({ brandName: brandName!, subdomain: subdomain! }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading  = false;
        this.errorMsg = err?.error?.message ?? 'Shop setup failed. Please try again.';
      }
    });
  }
}
