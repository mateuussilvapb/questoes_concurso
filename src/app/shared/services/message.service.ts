//Angular
import { inject, Injectable } from '@angular/core';

//Externos
import { MessageService as MessageServicePG } from 'primeng/api';

export type ToastSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  private readonly messageService = inject(MessageServicePG);

  showSuccess(detail: string, summary: string = 'Sucesso'): void {
    this.showGeneric(detail, summary, 'success');
  }

  showError(detail: string, summary: string = 'Erro'): void {
    this.showGeneric(detail, summary, 'danger');
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
