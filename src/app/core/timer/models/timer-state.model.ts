import { TimerMode } from '../enums/timer-mode';

export interface TimerState {
  visible: boolean;
  running: boolean;
  mode: TimerMode;
  elapsedSeconds: number;
  remainingSeconds: number;
  totalSeconds: number;
  minimized: boolean;
  disabledActions: boolean;
  position: {
    x: number;
    y: number;
  };
}
