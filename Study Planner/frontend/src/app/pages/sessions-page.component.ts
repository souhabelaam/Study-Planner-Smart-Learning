import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
  sessions: StudySession[] = [];
  subjects: Subject[] = [];

  subjectId = 0;
  durationMinutes = 60;
  date = new Date().toISOString().split('T')[0];
  startHour = 9;
  startMinute = 0;

  constructor() {
    this.load();
  }

  load(): void {
    this.api.getSubjects().subscribe((subjects) => {
      this.subjects = subjects;
      if (!this.subjectId && subjects.length) {
        this.subjectId = subjects[0].id;
      }
    });
    this.api.getSessions().subscribe((sessions) => (this.sessions = sessions));
  }

  create(): void {
    if (!this.subjectId) {
      return;
    }
    this.api
      .createSession({
        subjectId: this.subjectId,
        durationMinutes: this.durationMinutes,
        date: this.date,
        startHour: this.startHour,
        startMinute: this.startMinute
      })
      .subscribe(() => this.load());
  }

  deleteSession(id: number): void {
    this.api.deleteSession(id).subscribe(() => this.load());
  }
}
