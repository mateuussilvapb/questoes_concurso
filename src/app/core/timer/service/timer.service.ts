//Angular
import { computed, Injectable, signal } from '@angular/core';

//Aplicação
import { TimerState } from '../models/timer-state.model';
import { TimerMode } from '../enums/timer-mode';

@Injectable({
  providedIn: 'root',
})
export class TimerService {
  private readonly _state = signal<TimerState>({
    visible: false,
    running: false,
    minimized: false,

    mode: TimerMode.TIMER,

    totalSeconds: 0,
    remainingSeconds: 0,
    elapsedSeconds: 0,

    disabledActions: false,

    position: {
      x: 20,
      y: 20,
    },
  });

  readonly state = this._state.asReadonly();

  private interval?: ReturnType<typeof setInterval>;

  //#region Inicialização

  startTimer(seconds: number): void {
    this.clearInterval();

    this._state.update((state) => ({
      ...state,
      visible: true,
      running: true,
      mode: TimerMode.TIMER,
      totalSeconds: seconds,
      remainingSeconds: seconds,
      elapsedSeconds: 0,
    }));

    this.startLoop();
  }

  startStopwatch(disabled: boolean = false): void {
    this.clearInterval();

    this._state.update((state) => ({
      ...state,
      visible: true,
      running: true,
      mode: TimerMode.STOPWATCH,
      totalSeconds: 0,
      remainingSeconds: 0,
      elapsedSeconds: 0,
      disabledActions: disabled,
    }));

    this.startLoop();
  }

  startStopwatchDisabled(): void {
    this.startStopwatch(true);
  }

  //#endregion

  pause(): void {
    this.clearInterval();

    this._state.update((state) => ({
      ...state,
      running: false,
    }));
  }

  resume(): void {
    if (this._state().running) {
      return;
    }

    this._state.update((state) => ({
      ...state,
      running: true,
    }));

    this.startLoop();
  }

  reset(): void {
    const state = this._state();

    if (state.mode === TimerMode.TIMER) {
      this._state.update((s) => ({
        ...s,
        remainingSeconds: s.totalSeconds,
      }));
    } else {
      this._state.update((s) => ({
        ...s,
        elapsedSeconds: 0,
      }));
    }
  }

  stop(): void {
    this.clearInterval();

    this._state.update((state) => ({
      ...state,
      visible: false,
      running: false,
    }));
  }

  hide(): void {
    this._state.update((state) => ({
      ...state,
      visible: false,
    }));
  }

  show(): void {
    this._state.update((state) => ({
      ...state,
      visible: true,
    }));
  }

  minimize(): void {
    this._state.update((state) => ({
      ...state,
      minimized: true,
    }));
  }

  maximize(): void {
    this._state.update((state) => ({
      ...state,
      minimized: false,
    }));
  }

  toggleMinimize(): void {
    this._state.update((state) => ({
      ...state,
      minimized: !state.minimized,
    }));
  }

  updatePosition(x: number, y: number): void {
    this._state.update((state) => ({
      ...state,
      position: { x, y },
    }));
  }

  addSeconds(seconds: number): void {
    if (this._state().mode !== TimerMode.TIMER) {
      return;
    }

    this._state.update((state) => ({
      ...state,
      remainingSeconds: state.remainingSeconds + seconds,
      totalSeconds: state.totalSeconds + seconds,
    }));
  }

  removeSeconds(seconds: number): void {
    if (this._state().mode !== TimerMode.TIMER) {
      return;
    }

    this._state.update((state) => ({
      ...state,
      remainingSeconds: Math.max(0, state.remainingSeconds - seconds),
      totalSeconds: Math.max(0, state.totalSeconds - seconds),
    }));
  }

  readonly formattedTime = computed(() => {
    const state = this._state();
    const seconds = state.mode === TimerMode.TIMER ? state.remainingSeconds : state.elapsedSeconds;
    return this.format(seconds);
  });

  //#region Internos

  private format(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
  }

  private startLoop(): void {
    this.interval = setInterval(() => {
      const state = this._state();

      if (state.mode === TimerMode.STOPWATCH) {
        this._state.update((s) => ({
          ...s,
          elapsedSeconds: s.elapsedSeconds + 1,
        }));

        return;
      }

      const remaining = state.remainingSeconds - 1;

      if (remaining <= 0) {
        this.finish();
        return;
      }

      this._state.update((s) => ({
        ...s,
        remainingSeconds: remaining,
      }));
    }, 1000);
  }

  private finish(): void {
    this.clearInterval();

    this._state.update((state) => ({
      ...state,
      running: false,
      remainingSeconds: 0,
    }));

    // Futuramente:
    // this.finished.emit();
  }

  private clearInterval(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }

  //#endregion
}
