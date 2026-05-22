import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  standalone: true,
  selector: 'app-register-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register-page.component.html'
})
export class RegisterPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  error = '';
  loading = false;
  showPassword = false;

  form = this.fb.group({
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  submit(): void {
    if (this.form.invalid || this.loading) {
      return;
    }
    this.error = '';
    this.loading = true;
    this.authService.register(this.form.getRawValue() as { username: string; email: string; password: string }).subscribe({
      next: () => this.router.navigate(['/login']),
      error: (err: HttpErrorResponse) => {
        const backendMessage =
          typeof err.error === 'string'
            ? err.error
            : err.error && typeof err.error.message === 'string'
              ? err.error.message
              : '';
        this.error = backendMessage || 'Registration failed. Please try another username/email.';
        this.loading = false;
      }
    });
  }
}
