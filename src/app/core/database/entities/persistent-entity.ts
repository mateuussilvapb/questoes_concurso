import { Index } from '../decorators/index.decorator';
import { PrimaryKey } from '../decorators/primary-key.decorator';

export abstract class PersistentEntity {
  @PrimaryKey()
  id: string = crypto.randomUUID();

  @Index()
  dataCriacao: Date = new Date();

  @Index()
  dataAtualizacao: Date = new Date();

  touch() {
    this.dataAtualizacao = new Date();
  }
}
