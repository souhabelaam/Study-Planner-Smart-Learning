import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { StudentService } from '../core/student.service';
import { StudentNote, Subject } from '../core/models';

@Component({
  standalone: true,
  selector: 'app-notes-page',
  imports: [FormsModule],
  templateUrl: './notes-page.component.html'
})
export class NotesPageComponent implements OnInit {
  private readonly student = inject(StudentService);
  private readonly api = inject(ApiService);

  notes: StudentNote[] = [];
  subjects: Subject[] = [];
  editingId: number | null = null;
  title = '';
  content = '';
  grade: number | null = null;
  subjectId: number | null = null;
  message = '';

  ngOnInit(): void {
    this.load();
    this.api.getSubjects().subscribe((s) => (this.subjects = s));
  }

  load(): void {
    this.student.getNotes().subscribe((n) => (this.notes = n));
  }

  edit(note: StudentNote): void {
    this.editingId = note.id;
    this.title = note.title;
    this.content = note.content ?? '';
    this.grade = note.grade ?? null;
    this.subjectId = note.subjectId ?? null;
  }

  resetForm(): void {
    this.editingId = null;
    this.title = '';
    this.content = '';
    this.grade = null;
    this.subjectId = null;
  }

  save(): void {
    if (!this.title.trim()) return;
    const payload = {
      title: this.title.trim(),
      content: this.content,
      grade: this.grade,
      subjectId: this.subjectId
    };
    const req = this.editingId
      ? this.student.updateNote(this.editingId, payload)
      : this.student.createNote(payload);
    req.subscribe((n) => {
      if (n) {
        this.message = this.editingId ? 'Note mise à jour.' : 'Note ajoutée.';
        this.resetForm();
        this.load();
      }
    });
  }

  remove(id: number): void {
    this.student.deleteNote(id).subscribe(() => this.load());
  }

  averageGrade(): string {
    const grades = this.notes.filter((n) => n.grade != null).map((n) => n.grade!);
    if (!grades.length) return '—';
    const avg = grades.reduce((a, b) => a + b, 0) / grades.length;
    return avg.toFixed(1);
  }
}
