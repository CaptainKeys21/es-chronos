export class StateError {
  constructor(
    public readonly state: string,
    public readonly message: string,
  ) {}
}
