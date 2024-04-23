import SliceException from ".";

export class InvalidOperationException extends SliceException {
  constructor(message?: string) {
    super(message ?? "Slice1 encoded tags must be decoded with tag formats.");
    Object.setPrototypeOf(this, InvalidOperationException.prototype);
    this.name = this.constructor.name;
  }
}
