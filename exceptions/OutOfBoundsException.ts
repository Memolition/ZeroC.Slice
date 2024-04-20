import SliceException from ".";

export class OutOfBoundsException extends SliceException {
  constructor(message?: string) {
    super(message ?? "Attempting to decode past the end of the Slice decoder buffer.");
    Object.setPrototypeOf(this, OutOfBoundsException.prototype);
    this.name = this.constructor.name;
  }
}
