import { inject, Injectable } from '@angular/core';

import { AppDatabase } from '../../../database/app.database';
import { QuestaoEntity } from '../../../database/entities/questao-entity';
import { BaseRepository } from '../../base/base-repository';

@Injectable({ providedIn: 'root' })
export class QuestaoRepository extends BaseRepository<QuestaoEntity> {
  constructor() {
    super(inject(AppDatabase), 'questao', QuestaoEntity);
  }
}
