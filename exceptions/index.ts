export default class SliceException extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, SliceException.prototype);
        this.name = this.constructor.name;
    }
}

export * from './InvalidDataException';
export * from './OutOfBoundsException';
export * from './UnimplementedException';
