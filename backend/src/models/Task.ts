class ProgressBar {
  private _value: number = 0;

  constructor(initialValue: number = 0) {
    this.value = initialValue;
  }

  set value(newValue: number) {
    // Garante o "clamping" (limita entre 0 e 100)
    this._value = Math.max(0, Math.min(100, newValue));
  }

  get value(): number {
    return this._value;
  }

  get isComplete(): boolean {
    return this._value === 100;
  }
}

export default class Task {
  private _name: string;
  private _deadline: Date;
  private readonly _progress: ProgressBar;

  constructor(name: string, deadline: Date) {
    this._name = name;
    this._deadline = deadline;
    this._progress = new ProgressBar();
  }

  get name() {
    return this._name;
  }

  set name(newName: string) {
    this._name = newName;
  }

  get deadline() {
    return this._deadline;
  }

  set deadline(newDL: Date) {
    this._deadline = newDL;
  }

  get progress() {
    return this._progress.value;
  }

  set progress(newPercentage: number) {
    this._progress.value = newPercentage;
  }

  get isComplete() {
    return this._progress.isComplete;
  }

  public toJSON() {
    return {
      name: this.name,
      deadline: this.deadline.getTime(),
      progress: this.progress,
      isComplete: this.isComplete,
    };
  }
}
