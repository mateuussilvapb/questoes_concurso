//Angular
import { Component, computed, inject } from '@angular/core';
import { CdkDrag, CdkDragEnd } from '@angular/cdk/drag-drop';

//Aplicação
import { TimerMode } from '../../enums/timer-mode';
import { TimerService } from '../../service/timer.service';

//Externo
import { ButtonModule } from 'primeng/button';


@Component({
  selector: 'app-floating-timer',
  standalone: true,
  imports: [ButtonModule, CdkDrag],
  templateUrl: './floating-timer.html',
  styleUrl: './floating-timer.scss',
})
export class FloatingTimer {
  readonly timer = inject(TimerService);

  readonly state = this.timer.state;

  readonly isTimer = computed(() => this.state().mode === TimerMode.TIMER);
  readonly isStopwatch = computed(() => this.state().mode === TimerMode.STOPWATCH);
  readonly playPauseIcon = computed(() => (this.state().running ? 'pi pi-pause' : 'pi pi-play'));
  readonly disabled = computed(() => this.state().disabledActions);

  toggleRunning(): void {
    if (this.state().running) {
      this.timer.pause();
    } else {
      this.timer.resume();
    }
  }

  dragEnded(event: CdkDragEnd): void {
    const position = event.source.getFreeDragPosition();
    this.timer.updatePosition(position.x, position.y);
  }

  formattedTime = computed(() => this.timer.formattedTime());
}
