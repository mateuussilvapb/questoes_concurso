import { BaseEntity } from '../../../../shared/models/base-entity';

export interface Banca extends BaseEntity {
  nome: string;
  descricao: string;
}
