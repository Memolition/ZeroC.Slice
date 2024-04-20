import SliceException from ".";

export class InvalidDataException extends SliceException {
  constructor(message?: string) {
    super(message ?? "Attempting to decode past the end of the Slice decoder buffer.");
    Object.setPrototypeOf(this, InvalidDataException.prototype);
    this.name = this.constructor.name;
  }
}
