import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { Subject } from '../core/models';
import { catchError, of } from 'rxjs';

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

  constructor() {
    this.load();
  }

  load(): void {
    this.api.getSubjects().subscribe((subjects) => (this.subjects = subjects));
  }

  create(): void {
    const name = this.newName.trim();
    if (!name) {
      return;
    }
    this.error = '';
    this.message = '';
    this.api.createSubject(name).subscribe(() => {
      this.newName = '';
      this.message = 'Subject added successfully.';
      this.load();
    });
  }

  deleteSubject(id: number): void {
    this.error = '';
    this.message = '';
    this.api.deleteSubject(id).subscribe(() => this.load());
  }

  quickAdd(): void {
    this.error = '';
    this.message = '';
    const names = this.bulkNames
      .split(/[,;\r\n]+/)
      .map((name) => name.trim())
      .filter((name) => !!name);
    if (!names.length) {
      this.error = 'Please enter at least one subject.';
      return;
    }

    let created = 0;
    let processed = 0;
    names.forEach((name) => {
      this.api
        .createSubject(name)
        .pipe(catchError(() => of(null)))
        .subscribe((subject) => {
          processed += 1;
          if (subject) {
            created += 1;
          }
          if (processed === names.length) {
            this.bulkNames = '';
            this.message = created
              ? `${created} subject(s) added successfully.`
              : 'No new subjects added (duplicates ignored).';
            this.load();
          }
        });
    });
  }
}
