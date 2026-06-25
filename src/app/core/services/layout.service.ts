//Angular
import { toSignal } from '@angular/core/rxjs-interop';
import { inject, Injectable, signal, computed } from '@angular/core';

//Externos
import { Subject } from 'rxjs';

//Aplicação
import { ScreenSizeService } from './screen-size.service';

interface LayoutState {
  mainMenuVisible: boolean;
  sidebarMenuOptionsVisible: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  private readonly screenSizeService = inject(ScreenSizeService);

  private readonly menuToggle = new Subject<boolean>();
  public menuToggle$ = this.menuToggle.asObservable();

  private readonly width = toSignal(this.screenSizeService.width$, {
    initialValue: window.innerWidth,
  });

  constructor() {
    this.state.update((state) => ({ ...state, mainMenuVisible: this.width() > 991 }));
  }

  public state = signal<LayoutState>({
    mainMenuVisible: this.width() > 991,
    sidebarMenuOptionsVisible: false,
  });

  showMobileSidebar() {
    this.state.update((state) => ({ ...state, sidebarMenuOptionsVisible: true }));
  }

  onMenuToggle() {
    this.state.update((state) => {
      const nextState = !state.mainMenuVisible;
      this.menuToggle.next(nextState); // Mantido caso use esse subject em outro lugar
      return { ...state, mainMenuVisible: nextState };
    });
  }

  isDesktop = computed(() => this.width() > 991);

  isBigDesktop = computed(() => this.width() > 1710);

  isMobile = computed(() => this.width() <= 991);

  mainMenuVisible = computed(() => this.state().mainMenuVisible);
}
