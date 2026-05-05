import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { DestroyableComponent } from '../../core/base/destroyable.base';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-after-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './after-signup.component.html'
})
export class AfterSignupComponent extends DestroyableComponent {
  // Read from environment — not hardcoded
  readonly subdomainSuffix = environment.subdomainSuffix ?? 'pasal-e.me';

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
  saveSuccess = false;

  constructor(
    private fb:     FormBuilder,
    private auth:   AuthService,
    private router: Router
  ) { super(); }

  onBrandNameInput(event: Event): void {
    const val  = (event.target as HTMLInputElement).value;
    const slug = val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const ctrl = this.form.get('subdomain');
    if (ctrl && !ctrl.dirty) ctrl.setValue(slug, { emitEvent: true });
  }

  onSubdomainInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const slug  = input.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    this.form.get('subdomain')!.setValue(slug, { emitEvent: false });
    input.value = slug;
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true; this.errorMsg = '';

    const brandName = this.form.value.brandName ?? '';
    const subdomain = this.form.value.subdomain ?? '';

    this.auth.setupShop({ brandName, subdomain })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => { this.loading = false; this.router.navigate(['/dashboard']); },
        error: (err: { error?: { message?: string } }) => {
          this.loading  = false;
          this.errorMsg = err?.error?.message ?? 'Shop setup failed. Please try again.';
        }
      });
  }
}
