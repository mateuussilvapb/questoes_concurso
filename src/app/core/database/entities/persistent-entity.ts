import { inject } from '@angular/core';
import { Index } from '../decorators/index.decorator';
import { PrimaryKey } from '../decorators/primary-key.decorator';
import { IdGeneratorService } from '../../storage/id-generator/id-generator.service';

export abstract class PersistentEntity {
  private readonly idGeneratorService = inject(IdGeneratorService);

  @PrimaryKey()
  id: string = this.idGeneratorService.generate();

  @Index()
  dataCriacao: Date = new Date();

  @Index()
  dataAtualizacao: Date = new Date();

  touch() {
    this.dataAtualizacao = new Date();
  }
}
