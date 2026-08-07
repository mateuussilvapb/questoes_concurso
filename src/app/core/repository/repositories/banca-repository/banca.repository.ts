import { inject, Injectable } from '@angular/core';

import { AppDatabase } from '../../../database/app.database';
import { BancaEntity } from '../../../database/entities/banca-entity';
import { BaseRepository } from '../../base/base-repository';

@Injectable({ providedIn: 'root' })
export class BancaRepository extends BaseRepository<BancaEntity> {
  constructor() {
    super(inject(AppDatabase), 'banca', BancaEntity);
  }
}
