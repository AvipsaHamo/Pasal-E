// src/app/auth/signup/signup.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

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
export class SignupComponent {
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
  ) {}

  onSubmit(): void {
  if (this.form.invalid) { 
    this.form.markAllAsTouched(); 
    return; 
  }

  this.loading  = true;
  this.errorMsg = '';

  const { firstName, lastName, email, password, confirmPassword } = this.form.value;
  this.auth.register({
    firstName:       firstName!,
    lastName:        lastName!,
    email:           email!,
    password:        password!,
    confirmPassword: confirmPassword!
  }).subscribe({
    next: () => {
      this.loading = false;
      this.router.navigate(['/setup-shop']);
    },
    error: (err) => {
      this.loading = false;

      // Handle .NET validation errors
      if (err?.error?.errors) {
        // Flatten all error messages into a single string
        this.errorMsg = Object.values(err.error.errors).flat().join(' ');
      } else if (err?.error?.title) {
        this.errorMsg = err.error.title;
      } else {
        this.errorMsg = 'Registration failed. Please try again.';
      }
    }
  });
}

  get mismatch(): boolean {
    return this.form.hasError('mismatch') &&
      !!this.form.get('confirmPassword')?.touched;
  }
}