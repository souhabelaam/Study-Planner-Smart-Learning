import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, finalize } from 'rxjs';
import { ApiService } from '../core/api.service';
import { StudySession, Subject } from '../core/models';

@Component({
  standalone: true,
  selector: 'app-sessions-page',
  imports: [FormsModule],
  templateUrl: './sessions-page.component.html'
})
export class SessionsPageComponent {
  private readonly api = inject(ApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  sessions: StudySession[] = [];
  subjects: Subject[] = [];
  loading = false;
  saving = false;

  subjectId = 0;
  durationMinutes = 60;
  date = new Date().toISOString().split('T')[0];
  startHour = 9;
  startMinute = 0;

  constructor() {
    this.load();
  }

  load(): void {
    this.loading = true;
    forkJoin({
      subjects: this.api.getSubjects(),
      sessions: this.api.getSessions()
    })
      .pipe(finalize(() => { this.loading = false; this.cdr.detectChanges(); }))
      .subscribe(({ subjects, sessions }) => {
        this.subjects = subjects;
        this.sessions = sessions;
        if (!this.subjectId && subjects.length) {
          this.subjectId = subjects[0].id;
        }
        this.cdr.detectChanges();
      });
  }

  sessionSubjectName(session: StudySession): string {
    return session.subjectName ?? session.subject?.name ?? 'N/A';
  }

  create(): void {
    if (!this.subjectId || this.saving) return;
    this.saving = true;
    const payload = {
      subjectId: Number(this.subjectId),
      durationMinutes: this.durationMinutes,
      date: this.date,
      startHour: this.startHour,
      startMinute: this.startMinute
    };
    this.api
      .createSession(payload)
      .pipe(finalize(() => { this.saving = false; this.cdr.detectChanges(); }))
      .subscribe({
        next: (session) => {
          this.sessions = [session, ...this.sessions.filter((s) => s.id !== session.id)];
          this.cdr.detectChanges();
        },
        error: () => this.load()
      });
  }

  deleteSession(id: number): void {
    const previous = this.sessions;
    this.sessions = this.sessions.filter((s) => s.id !== id);
    this.cdr.detectChanges();
    this.api.deleteSession(id).subscribe({
      error: () => {
        this.sessions = previous;
        this.cdr.detectChanges();
      }
    });
  }
}
