import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { StudentService } from '../core/student.service';
import { GameScore } from '../core/models';

type Card = { id: number; emoji: string; flipped: boolean; matched: boolean };

@Component({
  standalone: true,
  selector: 'app-game-page',
  templateUrl: './game-page.component.html'
})
export class GamePageComponent implements OnInit, OnDestroy {
  private readonly student = inject(StudentService);

  private readonly emojis = ['📚', '🧠', '⏱️', '🎯', '📝', '✅', '🌟', '💡'];
  cards: Card[] = [];
  flipped: Card[] = [];
  moves = 0;
  matchedPairs = 0;
  playing = false;
  finished = false;
  score = 0;
  seconds = 0;
  leaderboard: GameScore[] = [];
  myBest: GameScore | null = null;
  lock = false;

  private timer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.student.getLeaderboard().subscribe((l) => (this.leaderboard = l));
    this.student.getMyBestScore().subscribe((b) => (this.myBest = b));
    this.startGame();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  startGame(): void {
    this.stopTimer();
    const pairs = [...this.emojis, ...this.emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
    this.cards = pairs;
    this.flipped = [];
    this.moves = 0;
    this.matchedPairs = 0;
    this.finished = false;
    this.score = 0;
    this.seconds = 0;
    this.playing = true;
    this.timer = setInterval(() => this.seconds++, 1000);
  }

  flip(card: Card): void {
    if (!this.playing || this.lock || card.flipped || card.matched) return;
    card.flipped = true;
    this.flipped.push(card);
    if (this.flipped.length < 2) return;

    this.moves++;
    const [a, b] = this.flipped;
    if (a.emoji === b.emoji) {
      a.matched = b.matched = true;
      this.matchedPairs++;
      this.flipped = [];
      if (this.matchedPairs === this.emojis.length) this.endGame();
    } else {
      this.lock = true;
      setTimeout(() => {
        a.flipped = b.flipped = false;
        this.flipped = [];
        this.lock = false;
      }, 700);
    }
  }

  private endGame(): void {
    this.playing = false;
    this.finished = true;
    this.stopTimer();
    this.score = Math.max(100, 1000 - this.moves * 12 - this.seconds * 2);
    this.student.saveGameScore(this.score, this.moves, this.seconds).subscribe((saved) => {
      if (saved) {
        this.myBest = saved;
        this.student.getLeaderboard().subscribe((l) => (this.leaderboard = l));
      }
    });
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }
}
