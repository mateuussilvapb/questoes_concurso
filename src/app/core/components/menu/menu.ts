//Angular
import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ItensMenu } from './itens-menu';

@Component({
  selector: 'app-menu',
  imports: [
    //Angular
    RouterLink,
    CommonModule,
    RouterLinkActive,
  ],
  templateUrl: './menu.html',
})
export class Menu {
  protected readonly itensMenu = computed(() => ItensMenu);
}
