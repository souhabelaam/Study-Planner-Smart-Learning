import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatHistoryItemResponse, ChatMessageDto, ChatService } from './chat.service';
import { finalize, timeout } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-chat-widget',
  imports: [FormsModule],
  templateUrl: './chat-widget.component.html'
})
export class ChatWidgetComponent implements OnChanges, AfterViewInit {
  private readonly chat = inject(ChatService);
  private readonly welcomeMessage: ChatMessageDto = {
    role: 'assistant',
    content: 'Hi! Ask me anything about your study plan, productivity, or how to improve your routine.'
  };

  @ViewChild('chatBody') private chatBody?: ElementRef<HTMLDivElement>;

  @Input({ required: true }) open = false;
  @Output() close = new EventEmitter<void>();
  @Output() assistantMessage = new EventEmitter<string>();

  collapsed = false;
  draft = '';
  loading = false;
  messages: ChatMessageDto[] = [this.welcomeMessage];
  private pendingScrollToBottom = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']?.currentValue) {
      this.collapsed = false;
      this.loadHistory();
      this.scheduleScrollToBottom();
    }
  }

  ngAfterViewInit(): void {
    this.scheduleScrollToBottom();

    // The chat panel animates in; scrolling too early can land at top.
    // A short burst of rAF scrolling makes it consistent across browsers.
    this.runScrollToBottomBurst();
  }

  toggleCollapsed(): void {
    this.collapsed = !this.collapsed;
  }

  closePanel(event: MouseEvent): void {
    event.stopPropagation();
    this.close.emit();
  }

  send(): void {
    const text = this.draft.trim();
    if (!text || this.loading) return;

    if (this.collapsed) {
      this.collapsed = false;
    }

    this.messages = [...this.messages, { role: 'user', content: text }];
    this.draft = '';
    this.loading = true;
    this.scheduleScrollToBottom();

    this.chat
      .send(text)
      .pipe(
        timeout({ first: 45_000 }),
        finalize(() => {
          this.loading = false;
          this.scheduleScrollToBottom();
        })
      )
      .subscribe({
        next: (res) => {
          this.messages = [...this.messages, { role: 'assistant', content: res.reply }];
          this.assistantMessage.emit(res.reply);
        },
        error: (err: unknown) => {
          const errorMessage =
            err instanceof Error
              ? err.message
              : typeof err === 'object' && err && 'message' in err
                ? String((err as { message: unknown }).message)
                : null;
          const msg = errorMessage || 'Chat API is not available right now. Please try again later.';
          this.messages = [...this.messages, { role: 'assistant', content: msg }];
          this.assistantMessage.emit(msg);
        }
      });
  }

  private loadHistory(): void {
    this.chat.getHistory().subscribe({
      next: (history) => {
        const mapped = history.map((m: ChatHistoryItemResponse) => ({
          role: m.role === 'USER' ? 'user' : 'assistant',
          content: m.content
        } satisfies ChatMessageDto));
        this.messages = mapped.length > 0 ? mapped : [this.welcomeMessage];
        this.scheduleScrollToBottom();
      },
      error: () => {
        this.messages = this.messages.length > 0 ? this.messages : [this.welcomeMessage];
        this.scheduleScrollToBottom();
      }
    });
  }

  private scheduleScrollToBottom(): void {
    this.pendingScrollToBottom = true;
    // Ensure DOM is painted (especially on first open / after history render).
    queueMicrotask(() => setTimeout(() => this.flushScrollToBottom(), 0));
  }

  private flushScrollToBottom(): void {
    if (!this.pendingScrollToBottom) return;
    this.pendingScrollToBottom = false;
    this.scrollToBottom();
    this.runScrollToBottomBurst();
  }

  private runScrollToBottomBurst(): void {
    let frames = 0;
    const step = () => {
      this.scrollToBottom();
      frames += 1;
      if (frames < 6) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  private scrollToBottom(): void {
    const el = this.chatBody?.nativeElement;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }
}

