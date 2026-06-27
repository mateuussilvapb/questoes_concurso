//Angular
import { Router } from '@angular/router';
import { Component, inject } from '@angular/core';

//Aplicação
import { LayoutBasePages } from '../../../../shared/components/layout-base-pages/layout-base-pages';

@Component({
  selector: 'app-materias-list-page',
  imports: [
    //Aplicação
    LayoutBasePages,
  ],
  templateUrl: './materias-list-page.html',
})
export class MateriasListPage {
  private readonly router = inject(Router);

  onAddMateria() {
    this.router.navigate(['materia', 'cadastro']);
  }
}
