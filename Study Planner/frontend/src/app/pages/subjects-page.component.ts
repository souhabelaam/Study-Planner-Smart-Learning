import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Subject } from '../core/models';

@Component({
  standalone: true,
  selector: 'app-subjects-page',
  imports: [FormsModule],
  templateUrl: './subjects-page.component.html'
})
export class SubjectsPageComponent {
  private readonly api = inject(ApiService);
  subjects: Subject[] = [];
  newName = '';
  bulkNames = '';
  message = '';
  error = '';
  loading = false;
  saving = false;

  constructor() {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api
      .getSubjects()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe((subjects) => (this.subjects = subjects));
  }

  create(): void {
    const name = this.newName.trim();
    if (!name || this.saving) {
      return;
    }
    this.error = '';
    this.message = '';
    this.saving = true;
    this.api
      .createSubject(name)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (subject) => {
          this.newName = '';
          this.message = 'Subject added successfully.';
          this.subjects = [...this.subjects.filter((s) => s.id !== subject.id), subject].sort((a, b) =>
            a.name.localeCompare(b.name)
          );
        },
        error: () => {
          this.error = 'Could not add subject. Please try again.';
          this.load();
        }
      });
  }

  deleteSubject(id: number): void {
    const previous = this.subjects;
    this.subjects = this.subjects.filter((s) => s.id !== id);
    this.error = '';
    this.message = '';
    this.api.deleteSubject(id).subscribe({
      next: () => (this.message = 'Subject removed.'),
      error: () => {
        this.subjects = previous;
        this.error = 'Could not remove subject. Please try again.';
      }
    });
  }

  quickAdd(): void {
    const names = this.bulkNames
      .split(/[,;\r\n]+/)
      .map((name) => name.trim())
      .filter((name) => !!name);
    if (!names.length || this.saving) {
      this.error = 'Please enter at least one subject.';
      return;
    }

    this.error = '';
    this.message = '';
    this.saving = true;
    this.api
      .createSubjectsBulk(names)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (created) => {
          this.bulkNames = '';
          if (!created.length) {
            this.message = 'No new subjects added (duplicates ignored).';
            return;
          }
          const byId = new Map(this.subjects.map((s) => [s.id, s]));
          created.forEach((s) => byId.set(s.id, s));
          this.subjects = [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
          this.message = `${created.length} subject(s) added successfully.`;
        },
        error: () => {
          this.error = 'Could not add subjects. Please try again.';
          this.load();
        }
      });
  }
}
