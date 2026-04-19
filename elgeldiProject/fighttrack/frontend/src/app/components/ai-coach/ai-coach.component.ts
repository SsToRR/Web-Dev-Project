import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AiCoachMessage, ApiService } from '../../services/api.service';

interface ChatMessage extends AiCoachMessage {
  status?: 'error';
}

@Component({
  selector: 'app-ai-coach',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-coach.component.html',
  styleUrl: './ai-coach.component.css',
})
export class AiCoachComponent {
  isOpen = false;
  isLoading = false;
  question = '';
  errorMessage = '';
  messages: ChatMessage[] = [
    {
      role: 'assistant',
      content: 'Ask me about training structure, warm-ups, recovery, discipline, or beginner-safe technique ideas.',
    },
  ];

  constructor(private api: ApiService) {}

  toggleChat() {
    this.isOpen = !this.isOpen;
    this.errorMessage = '';
  }

  closeChat() {
    this.isOpen = false;
    this.errorMessage = '';
  }

  sendMessage() {
    const message = this.question.trim();
    if (!message || this.isLoading) {
      return;
    }

    const history = this.messages
      .filter((item) => !item.status)
      .slice(-8)
      .map(({ role, content }) => ({ role, content }));

    this.messages.push({ role: 'user', content: message });
    this.question = '';
    this.errorMessage = '';
    this.isLoading = true;

    this.api.askAiCoach(message, history).subscribe({
      next: (response) => {
        this.messages.push({ role: 'assistant', content: response.reply });
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = this.getErrorMessage(err);
        this.messages.push({ role: 'assistant', content: this.errorMessage, status: 'error' });
        this.isLoading = false;
      },
    });
  }

  private getErrorMessage(err: any): string {
    if (err?.status === 401 || err?.status === 403) {
      return 'Please sign in again to use AI Coach.';
    }

    if (err?.status === 503) {
      return err?.error?.detail || 'AI Coach is not configured or temporarily unavailable.';
    }

    return err?.error?.detail || 'AI Coach is unavailable right now. Try again in a moment.';
  }
}
