import { Buffer } from 'node:buffer';
import { OutOfBoundsException } from './exceptions';

export default class BufferReader {
  private _position:number = 0;
  private _length:number = 0;

  constructor (
    public buffer : Buffer
  ) {
    this._length = buffer.byteLength;
  }

  public read(size: number = 1, peek: boolean = false) : Buffer {
    if(this._position + size > this._length) {
      throw new OutOfBoundsException();
    }

    const buffer = this.buffer.subarray(this._position, this._length);

    if(!peek) this._position += size;

    return buffer;
  }

  public seek(position:number) : void {
    if(position < 0 || position > this._length) throw new OutOfBoundsException();

    this._position = position;
  }

  public getPosition() : number {
    return this._position;
  }

  public getUnreadLength() : number {
    const unread = this._length - this._position;
    return unread >= 0 ? unread : 0;
  }
}
