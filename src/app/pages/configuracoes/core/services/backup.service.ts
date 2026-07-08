import { Injectable, inject } from '@angular/core';
import { StorageService } from '../../../../core/storage/storage.service';
import { BackupData, ImportMode, MergeResult } from '../../../../core/storage/backup.models';


@Injectable({
  providedIn: 'root',
})
export class BackupService {
  private readonly storageService = inject(StorageService);

  export(): void {
    const backup = this.storageService.exportBackup();

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = this.generateFileName();

    anchor.click();

    URL.revokeObjectURL(url);
  }

  async import(file: File, mode: ImportMode): Promise<MergeResult> {
    const backup = await this.readFile(file);

    return this.storageService.importBackup(backup, mode);
  }

  private readFile(file: File): Promise<BackupData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        try {
          resolve(JSON.parse(reader.result as string));
        } catch {
          reject(new Error('Arquivo de backup inválido.'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Não foi possível ler o arquivo.'));
      };

      reader.readAsText(file);
    });
  }

  private generateFileName(): string {
    const date = new Date().toISOString().slice(0, 10);

    return `backup-${date}.json`;
  }
}
