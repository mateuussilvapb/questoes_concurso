import { inject, Injectable } from '@angular/core';

import { AppDatabase } from '../../../database/app.database';
import { AlternativaEntity } from '../../../database/entities/alternativa-entity';
import { BaseRepository } from '../../base/base-repository';

@Injectable({ providedIn: 'root' })
export class AlternativaRepository extends BaseRepository<AlternativaEntity> {
  constructor() {
    super(inject(AppDatabase), 'alternativa', AlternativaEntity);
  }
}
