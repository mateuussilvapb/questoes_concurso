import { BaseEntity } from '../../../../shared/models/base-entity';

export interface Assunto extends BaseEntity {
  nome: string;
  descricao: string;
  idMateria: string;
}
