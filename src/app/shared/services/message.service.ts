//Angular
import { inject, Injectable } from '@angular/core';

//Externos
import { ToastSeverity } from '../types/types-const';
import { MessageService as MessageServicePG } from 'primeng/api';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  private readonly messageService = inject(MessageServicePG);

  showSuccess(detail: string, summary: string = 'Sucesso'): void {
    this.showGeneric(detail, summary, 'success');
  }

  showError(detail: string, summary: string = 'Erro'): void {
    this.showGeneric(detail, summary, 'error');
  }

  showWarning(detail: string, summary: string = 'Atenção'): void {
    this.showGeneric(detail, summary, 'warn');
  }

  showInfo(detail: string, summary: string = 'Informação'): void {
    this.showGeneric(detail, summary, 'info');
  }

  showGeneric(detail: string, summary: string, severity: ToastSeverity, life: number = 5000): void {
    this.messageService.add({
      severity,
      summary,
      detail,
      life,
    });
  }
}
