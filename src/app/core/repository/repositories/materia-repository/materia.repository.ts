import { inject, Injectable } from '@angular/core';

import { AppDatabase } from '../../../database/app.database';
import { MateriaEntity } from '../../../database/entities/materia-entity';
import { BaseRepository } from '../../base/base-repository';

@Injectable({ providedIn: 'root' })
export class MateriaRepository extends BaseRepository<MateriaEntity> {
  constructor() {
    super(inject(AppDatabase), 'materia', MateriaEntity);
  }
}
