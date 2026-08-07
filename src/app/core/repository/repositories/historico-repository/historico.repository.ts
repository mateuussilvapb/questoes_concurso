import { inject, Injectable } from '@angular/core';

import { AppDatabase } from '../../../database/app.database';
import { HistoricoEntity } from '../../../database/entities/historico-entity';
import { BaseRepository } from '../../base/base-repository';

@Injectable({ providedIn: 'root' })
export class HistoricoRepository extends BaseRepository<HistoricoEntity> {
  constructor() {
    super(inject(AppDatabase), 'historico', HistoricoEntity);
  }
}
