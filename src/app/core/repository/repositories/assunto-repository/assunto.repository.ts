import { inject, Injectable } from '@angular/core';

import { AppDatabase } from '../../../database/app.database';
import { AssuntoEntity } from '../../../database/entities/assunto-entity';
import { BaseRepository } from '../../base/base-repository';

@Injectable({ providedIn: 'root' })
export class AssuntoRepository extends BaseRepository<AssuntoEntity> {
  constructor() {
    super(inject(AppDatabase), 'assunto', AssuntoEntity);
  }
}
