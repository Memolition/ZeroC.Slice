import { Buffer } from 'node:buffer';
import { OutOfBoundsException } from './exceptions/OutOfBoundsException.ts';

export default class BufferReader {
  private _position:number = 0;
  private _length:number = 0;

  constructor (
    public buffer : Buffer
  ) {
    this._length = buffer.byteLength;
  }

  public read(size: number = 1, peek: boolean = false) : Buffer {
    const newPosition = this._position + size;
    if(newPosition > this._length) {
      throw new OutOfBoundsException();
    }

    const buffer = this.buffer.subarray(this._position, newPosition);

    if(!peek) this._position += size;

    return buffer;
  }

  public seek(position:number) : void {
    if(position < 0 || position > this._length) throw new OutOfBoundsException();

    this._position = position;
  }

  public advance(length:number) : void {
    if(this._position + length > this._length) {
      throw new OutOfBoundsException();
    }

    this._position += length;
  }

  public rewind(length:number) : void {
    if(this._position - length < 0) {
      throw new OutOfBoundsException();
    }
    
    this._position -= length;
  }

  public getPosition() : number {
    return this._position;
  }

  public getUnreadLength() : number {
    const unread = this._length - this._position;
    return unread >= 0 ? unread : 0;
  }

  public getUnreadBuffer(length:number) : Buffer {
    if(this._position + length > this._length) {
      throw new OutOfBoundsException();
    }

    return this.buffer.subarray(this._position, this._length);
  }

  public end() : boolean {
    return this._position === length - 1;
  }
}
