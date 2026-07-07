//Angular
import { Router } from '@angular/router';
import { Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-page-not-found',
  imports: [
    //Angular

    //Externo
    ButtonModule,
  ],
  templateUrl: './page-not-found.html',
  styleUrl: './page-not-found.scss',
})
export class PageNotFound {
  private readonly router = inject(Router);

  telaInicial() {
    this.router.navigate(['/']);
  }
}
