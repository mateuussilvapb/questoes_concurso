import { inject, Injectable } from '@angular/core';
import { AlternativaDto } from '../../alternativas/core/dtos/alternativa.dto';
import { Alternativa } from '../../alternativas/core/models/alternativa.model';
import { IdGeneratorService } from '../../../../core/storage/id-generator/id-generator.service';

@Injectable({
  providedIn: 'root',
})
export class AlternativasFactoryService {
  private readonly idGeneratorService = inject(IdGeneratorService);

  // =====================================================
  // GERAÇÃO DAS ALTERNATIVAS
  // =====================================================

  criarAlternativasVF(alternativas: AlternativaDto[]): Alternativa[] {
    const correta = alternativas.find((a) => a.correta);
    const respostaVerdadeira = correta?.texto.trim().toLowerCase() === 'verdadeiro';
    return [
      {
        id: this.idGeneratorService.generate(),
        texto: 'Verdadeiro',
        correta: respostaVerdadeira,
      },

      {
        id: this.idGeneratorService.generate(),
        texto: 'Falso',
        correta: !respostaVerdadeira,
      },
    ];
  }

  criarAlternativas(alternativas: AlternativaDto[]): Alternativa[] {
    return alternativas.map((a) => ({
      id: this.idGeneratorService.generate(),
      texto: a.texto.trim(),
      correta: a.correta,
    }));
  }
}
