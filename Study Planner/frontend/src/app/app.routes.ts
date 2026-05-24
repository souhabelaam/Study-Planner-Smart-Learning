import { Routes } from '@angular/router';
import { authGuard, adminGuard, studentGuard } from './core/auth.guard';
import { LoginPageComponent } from './pages/login-page.component';
import { RegisterPageComponent } from './pages/register-page.component';
import { DashboardPageComponent } from './pages/dashboard-page.component';
import { SubjectsPageComponent } from './pages/subjects-page.component';
import { SessionsPageComponent } from './pages/sessions-page.component';
import { StatsPageComponent } from './pages/stats-page.component';
import { HomePageComponent } from './pages/home-page.component';
import { LabPageComponent } from './pages/lab-page.component';
import { NotesPageComponent } from './pages/notes-page.component';
import { GamePageComponent } from './pages/game-page.component';
import { AdminPageComponent } from './pages/admin-page.component';

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'home', component: HomePageComponent },
  { path: 'login', component: LoginPageComponent },
  { path: 'register', component: RegisterPageComponent },
  { path: 'admin', component: AdminPageComponent, canActivate: [adminGuard] },
  { path: 'dashboard', component: DashboardPageComponent, canActivate: [studentGuard] },
  { path: 'lab', component: LabPageComponent, canActivate: [studentGuard] },
  { path: 'notes', component: NotesPageComponent, canActivate: [studentGuard] },
  { path: 'game', component: GamePageComponent, canActivate: [studentGuard] },
  { path: 'subjects', component: SubjectsPageComponent, canActivate: [studentGuard] },
  { path: 'sessions', component: SessionsPageComponent, canActivate: [studentGuard] },
  { path: 'stats', component: StatsPageComponent, canActivate: [studentGuard] },
  { path: '**', redirectTo: '' }
];
