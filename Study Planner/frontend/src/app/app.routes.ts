import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { LoginPageComponent } from './pages/login-page.component';
import { RegisterPageComponent } from './pages/register-page.component';
import { DashboardPageComponent } from './pages/dashboard-page.component';
import { SubjectsPageComponent } from './pages/subjects-page.component';
import { SessionsPageComponent } from './pages/sessions-page.component';
import { StatsPageComponent } from './pages/stats-page.component';

export const routes: Routes = [
  { path: 'login', component: LoginPageComponent },
  { path: 'register', component: RegisterPageComponent },
  { path: 'dashboard', component: DashboardPageComponent, canActivate: [authGuard] },
  { path: 'subjects', component: SubjectsPageComponent, canActivate: [authGuard] },
  { path: 'sessions', component: SessionsPageComponent, canActivate: [authGuard] },
  { path: 'stats', component: StatsPageComponent, canActivate: [authGuard] },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' }
];
