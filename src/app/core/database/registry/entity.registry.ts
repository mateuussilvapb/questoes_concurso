import { Alternativa } from '../entities/alternativa-entity';
import { Assunto } from '../entities/assunto-entity';
import { Banca } from '../entities/banca-entity';
import { Historico } from '../entities/historico-entity';
import { Materia } from '../entities/materia-entity';
import { Questao } from '../entities/questao-entity';

export class EntityRegistry {
  /**
   * Lista de todas as entidades persistentes.
   *
   * Apenas importar as classes já é suficiente
   * para que os decorators sejam executados.
   */
  static readonly entities: Function[] = [Materia, Assunto, Questao, Alternativa, Banca, Historico];
}
