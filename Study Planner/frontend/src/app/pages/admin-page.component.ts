import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService, AdRequest } from '../core/admin.service';
import { AuthService } from '../core/auth.service';
import { AdminOverview, AdminUser, Advertisement } from '../core/models';

@Component({
  standalone: true,
  selector: 'app-admin-page',
  imports: [FormsModule],
  templateUrl: './admin-page.component.html'
})
export class AdminPageComponent implements OnInit {
  private readonly admin = inject(AdminService);
  readonly auth = inject(AuthService);

  overview: AdminOverview | null = null;
  users: AdminUser[] = [];
  ads: Advertisement[] = [];
  adForm: AdRequest = { title: '', description: '', linkUrl: '', audience: 'STUDENT', active: true };
  editingAdId: number | null = null;
  userFilter = '';

  editingUserId: number | null = null;
  userForm = { username: '', email: '', role: 'USER' };
  userError = '';

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.admin.getOverview().subscribe((o) => (this.overview = o));
    this.admin.getUsers().subscribe((u) => (this.users = u));
    this.admin.getAds().subscribe((a) => (this.ads = a));
  }

  filteredUsers(): AdminUser[] {
    const q = this.userFilter.trim().toLowerCase();
    if (!q) return this.users;
    return this.users.filter(
      (u) => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }

  editAd(ad: Advertisement): void {
    this.editingAdId = ad.id;
    this.adForm = {
      title: ad.title,
      description: ad.description,
      linkUrl: ad.linkUrl ?? '',
      imageUrl: ad.imageUrl ?? '',
      audience: ad.audience,
      active: ad.active
    };
  }

  resetAdForm(): void {
    this.editingAdId = null;
    this.adForm = { title: '', description: '', linkUrl: '', audience: 'STUDENT', active: true };
  }

  saveAd(): void {
    if (!this.adForm.title?.trim()) return;
    const req = this.editingAdId
      ? this.admin.updateAd(this.editingAdId, this.adForm)
      : this.admin.createAd(this.adForm);
    req.subscribe(() => {
      this.resetAdForm();
      this.reload();
    });
  }

  removeAd(id: number): void {
    this.admin.deleteAd(id).subscribe(() => this.reload());
  }

  roleLabel(roles: string[]): string {
    return roles.includes('ADMIN') ? 'Admin' : 'Étudiant';
  }

  editUser(u: AdminUser): void {
    this.editingUserId = u.id;
    this.userForm = {
      username: u.username,
      email: u.email,
      role: u.roles.includes('ADMIN') ? 'ADMIN' : 'USER'
    };
    this.userError = '';
  }

  cancelEditUser(): void {
    this.editingUserId = null;
    this.userForm = { username: '', email: '', role: 'USER' };
    this.userError = '';
  }

  saveUser(): void {
    if (!this.editingUserId) return;
    if (!this.userForm.username.trim() || !this.userForm.email.trim()) {
      this.userError = 'Le nom d’utilisateur et l’email sont requis.';
      return;
    }

    this.admin.updateUser(this.editingUserId, {
      username: this.userForm.username.trim(),
      email: this.userForm.email.trim(),
      roles: [this.userForm.role]
    }).subscribe({
      next: () => {
        this.cancelEditUser();
        this.reload();
      },
      error: (err) => {
        this.userError = err.error?.message || 'Erreur lors de la mise à jour.';
      }
    });
  }

  deleteUser(id: number): void {
    if (confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) {
      this.admin.deleteUser(id).subscribe({
        next: () => this.reload(),
        error: (err) => alert(err.error?.message || 'Impossible de supprimer l’utilisateur.')
      });
    }
  }

  isCurrentUser(username: string): boolean {
    return username === this.auth.getUsername();
  }
}
