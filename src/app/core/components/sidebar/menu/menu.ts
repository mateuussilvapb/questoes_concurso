//Angular
import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ItensMenu } from './itens-menu';
import { LayoutService } from '../../../services/layout.service';

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
  private readonly layoutService = inject(LayoutService);

  protected readonly itensMenu = computed(() => ItensMenu);

  onItemClick() {
    if (!this.layoutService.isMobile()) {
      return;
    }

    this.layoutService.state.update((state) => ({ ...state, mainMenuVisible: false }));
  }
}
