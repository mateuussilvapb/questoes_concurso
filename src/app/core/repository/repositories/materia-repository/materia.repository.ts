import { AppDatabase } from '../../../database/app.database';
import { MateriaEntity } from '../../../database/entities/materia-entity';
import { BaseRepository } from '../../base/base-repository';

export class MateriaRepository extends BaseRepository<MateriaEntity> {
  constructor(database: AppDatabase) {
    super(database, 'materia');
  }
}
