import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  standalone: true,
  selector: 'app-login-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.component.html'
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  error = '';
  loading = false;
  showPassword = false;

  form = this.fb.group({
    username: ['', Validators.required],
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
    const { username, password } = this.form.getRawValue();
    this.authService.login({ username: username!.trim(), password: password! }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate([this.authService.homeRoute()]);
      },
      error: () => {
        this.authService.clearSession();
        this.error = 'Identifiants invalides. Essayez demo / Demo123! ou admin / Admin123!';
        this.loading = false;
      }
    });
  }
}
