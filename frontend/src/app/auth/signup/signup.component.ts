import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { DestroyableComponent } from '../../core/base/destroyable.base';

function passwordsMatch(ctrl: AbstractControl): ValidationErrors | null {
  const pw  = ctrl.get('password')?.value;
  const cpw = ctrl.get('confirmPassword')?.value;
  return pw && cpw && pw !== cpw ? { mismatch: true } : null;
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html'
})
export class SignupComponent extends DestroyableComponent {
  form = this.fb.group({
    firstName:       ['', Validators.required],
    lastName:        ['', Validators.required],
    email:           ['', [Validators.required, Validators.email]],
    password:        ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  }, { validators: passwordsMatch });

  loading  = false;
  errorMsg = '';

  constructor(
    private fb:     FormBuilder,
    private auth:   AuthService,
    private router: Router
  ) { super(); }

  get mismatch(): boolean {
    return this.form.hasError('mismatch') && !!this.form.get('confirmPassword')?.touched;
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true; this.errorMsg = '';

    // Null-safe — no ! assertions
    const firstName       = this.form.value.firstName       ?? '';
    const lastName        = this.form.value.lastName        ?? '';
    const email           = this.form.value.email           ?? '';
    const password        = this.form.value.password        ?? '';
    const confirmPassword = this.form.value.confirmPassword ?? '';

    this.auth.register({ firstName, lastName, email, password, confirmPassword })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => { this.loading = false; this.router.navigate(['/setup-shop']); },
        error: (err: { error?: { message?: string } }) => {
          this.loading  = false;
          this.errorMsg = err?.error?.message ?? 'Registration failed. Please try again.';
        }
      });
  }
}
