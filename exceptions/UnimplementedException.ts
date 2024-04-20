import SliceException from ".";

export class UnimplementedException extends SliceException {
  constructor(message?: string) {
    super(message ?? "Attempting to decode past the end of the Slice decoder buffer.");
    Object.setPrototypeOf(this, UnimplementedException.prototype);
    this.name = this.constructor.name;
  }
}
