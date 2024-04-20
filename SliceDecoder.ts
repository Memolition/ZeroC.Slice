import { Buffer } from 'node:buffer';
import BufferReader from './BufferReader';
import { InvalidDataException, OutOfBoundsException } from './exceptions';
import { UnimplementedException } from './exceptions/UnimplementedException';

export enum SliceEncoding {
  slice1 = 'Slice1',
  slice2 = 'Slice2',
}

export default class SliceDecoder {
  private _reader:BufferReader;

  constructor(
    public buffer:Buffer,
    public encoding:SliceEncoding = SliceEncoding.slice2,
  ) {
    this._reader = new BufferReader(this.buffer);
  }

  public static checkBoolValue(value:number) : void {
      if (value > 1) {
        throw new InvalidDataException("The value is out of the bool type accepted range.");
      }
  }

  public decodeBool() : boolean {
    const value = this.decodeUInt8();
    if(value === null) throw new InvalidDataException("End of buffer");

    switch(value) {
      case 0: return false
      case 1: return true
      default: throw new InvalidDataException("The value is out of the bool type accepted range.")
    }
  }

  public decodeFloat32() : number {
    return this._reader.read(4).readFloatLE();
  }

  public decodeFloat64() : number {
    return this._reader.read(8).readDoubleLE();
  }

  public decodeInt8() : number {
    return this._reader.read(1).readInt8();
  }

  public decodeInt16() : number {
    return this._reader.read(2).readInt16LE();
  }

  public decodeInt32() : number {
    return this._reader.read(4).readInt32LE();
  }

  public decodeInt64() : bigint {
    return this._reader.read(8).readBigInt64LE();
  }

  public decodeUInt8() : number {
    return this._reader.read(1).readUInt8();
  }

  public decodeUInt16() : number {
    return this._reader.read(2).readUInt16LE();
  }

  public decodeUInt32() : number {
    return this._reader.read(4).readUInt32LE();
  }

  public decodeUInt64() : bigint {
    return this._reader.read(8).readBigUInt64LE();
  }

  public decodeVarInt32() : number {
    const int = this.decodeVarInt62();

    if(typeof int !== 'number' || !Number.isInteger(int)) {
      throw new InvalidDataException('The value is out of the varint32 accepted range.');
    }

    return int;
  }

  public decodeVarInt62() : number | bigint {
    switch(this._reader.read(1, true).readUInt8() & 0x03) {
      case 0: return this.decodeInt8() >> 2;
      case 1: return this.decodeInt16() >> 2;
      case 2: return this.decodeInt32() >> 2;
      default: return this.decodeInt64() >> 2n;
    }
  }

  public decodeVarUInt32() : number {
    const num = BigInt.asIntN(32, this.decodeVarUInt62());

    if(num < 0) {
      throw new InvalidDataException('The value is out of the varuint32 accepted range.');
    }

    return Number(num);
  }

  public decodeVarUInt62() : bigint {
    switch(this._reader.read(1, true).readUInt8() & 0x03) {
      case 0: return BigInt(this.decodeUInt8()) >> 2n;
      case 1: return BigInt(this.decodeUInt16()) >> 2n;
      case 2: return BigInt(this.decodeUInt32()) >> 2n;
      default: return this.decodeUInt64() >> 2n;
    }
  }

  public decodeSize() : number  {
    if(this.encoding != SliceEncoding.slice1) {
      try {
        return this.decodeVarUInt32();
      } catch (exception) {
        throw new InvalidDataException("Cannot decode size larger than int.MaxValue.");
      }
    }

    throw new UnimplementedException(`${SliceEncoding.slice1} decoding not implemented.`);
  }

  public decodeString() : string {
    const size = this.decodeSize();

    if(size == 0) {
      return "";
    }
    else if(this._reader.getUnreadLength() >= size) {
      try {
        return this._reader.read(size).toString();
      }
      catch (e) {
        throw new InvalidDataException("Invalid UTF-8 string.");
      }
    }
    throw new OutOfBoundsException();
  }
}
