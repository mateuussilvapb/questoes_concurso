import { BaseEntity } from '../../../../shared/models/base-entity';

export interface Materia extends BaseEntity {
  nome: string;
  descricao: string;
}
