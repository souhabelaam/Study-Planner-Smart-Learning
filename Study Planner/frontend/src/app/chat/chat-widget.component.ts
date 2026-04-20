import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatMessageDto, ChatService } from './chat.service';

@Component({
  standalone: true,
  selector: 'app-chat-widget',
  imports: [FormsModule],
  templateUrl: './chat-widget.component.html'
})
export class ChatWidgetComponent implements OnChanges {
  private readonly chat = inject(ChatService);

  @Input({ required: true }) open = false;
  @Output() close = new EventEmitter<void>();
  @Output() assistantMessage = new EventEmitter<string>();

  collapsed = false;
  draft = '';
  loading = false;
  messages: ChatMessageDto[] = [
    {
      role: 'assistant',
      content: 'Hi! Ask me anything about your study plan, productivity, or how to improve your routine.'
    }
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']?.currentValue) {
      this.collapsed = false;
    }
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

    this.chat.send(text).subscribe({
      next: (res) => {
        this.messages = [...this.messages, { role: 'assistant', content: res.reply }];
        this.assistantMessage.emit(res.reply);
        this.loading = false;
      },
      error: (err: unknown) => {
        const errorMessage = err instanceof Error ? err.message : null;
        const msg = errorMessage || 'Chat API is not available right now. Please try again later.';
        this.messages = [
          ...this.messages,
          {
            role: 'assistant',
            content: msg
          }
        ];
        this.assistantMessage.emit(msg);
        this.loading = false;
      }
    });
  }
}

