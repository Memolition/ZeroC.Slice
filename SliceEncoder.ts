import { EncodeAction } from "./EncodingAction.ts";
import { SliceEncoding } from "./SliceEncoding.ts";
import { InvalidDataException } from "./exceptions/InvalidDataException.ts";
import { InvalidOperationException } from "./exceptions/InvalidOperationException.ts";
import { OutOfBoundsException } from "./exceptions/OutOfBoundsException.ts";

enum SliceNumber {
  sbyte = 'sbyte',
  short = 'short',
  int = 'int',
  long = 'long',

  byte = 'byte',
  ushort = 'ushort',
  uint = 'uint',
  ulong = 'ulong',

  float = 'float',
  double = 'double',
}

export default class SliceEncoder {
  public _buffer:Buffer[] = [];

  public encodedByteCount:number = 0;

  constructor(
    public encoding:SliceEncoding = SliceEncoding.slice2,
  ) {
  }

  public getBuffer() : Buffer {
    return Buffer.concat(this._buffer);
  }

  public seek(position:number) : void {
    if(position < 0) throw new OutOfBoundsException();

    this.encodedByteCount = position;
  }

  public advance(size:number = 1) {
    this.encodedByteCount += size;
  }

  private encodeFixedSizeNumeric(value:number|bigint, size:SliceNumber) : void {
    let byteSize = 1;
    if(size === SliceNumber.short || size === SliceNumber.ushort) {
      byteSize = 2;
    } else if(size === SliceNumber.int || size === SliceNumber.uint || size === SliceNumber.float) {
      byteSize = 4;
    } else if(size === SliceNumber.long || size === SliceNumber.ulong || size === SliceNumber.double) {
      byteSize = 8
    }

    const buffer = Buffer.alloc(byteSize);

    switch(size) {
      //Signed
      case SliceNumber.sbyte:
        buffer.writeInt8(Number(value));
        break;
      case SliceNumber.short:
        buffer.writeInt16LE(Number(value));
        break;
      case SliceNumber.int:
        buffer.writeInt32LE(Number(value));
        break;
      case SliceNumber.long:
        buffer.writeBigInt64LE(BigInt(value));
        break;

      //Unsigned
      case SliceNumber.byte:
        buffer.writeUInt8(Number(value));
        break;
      case SliceNumber.ushort:
        buffer.writeUInt16LE(Number(value));
        break;
      case SliceNumber.uint:
        buffer.writeUInt32LE(Number(value));
        break;
      case SliceNumber.ulong:
        buffer.writeBigUInt64LE(BigInt(value));
        break;

      //Decimal
      case SliceNumber.float:
        buffer.writeFloatLE(Number(value));
        break;
      case SliceNumber.double:
        buffer.writeDoubleLE(Number(value));
        break;
    }

    this._buffer.push(buffer);
    this.advance(byteSize);
  }

  public encodeInt8(value:number) {
    this.encodeFixedSizeNumeric(value, SliceNumber.sbyte);
  }

  public encodeInt16(value:number) {
    this.encodeFixedSizeNumeric(value, SliceNumber.short);
  }

  public encodeInt32(value:number) {
    this.encodeFixedSizeNumeric(value, SliceNumber.int);
  }

  public encodeInt64(value:bigint) {
    this.encodeFixedSizeNumeric(value, SliceNumber.long);
  }

  public encodeUInt8(value:number) {
    this.encodeFixedSizeNumeric(value, SliceNumber.byte);
  }

  public encodeUInt16(value:number) {
    this.encodeFixedSizeNumeric(value, SliceNumber.ushort);
  }

  public encodeUInt32(value:number) {
    this.encodeFixedSizeNumeric(value, SliceNumber.uint);
  }

  public encodeUInt64(value:bigint) {
    this.encodeFixedSizeNumeric(value, SliceNumber.ulong);
  }

  public encodeBool(value:boolean) : void {
    this.encodeUInt8(value ? 1 : 0);
  }

  public encodeSize(value:number|bigint) {
    if(value < 0) {
      throw new RangeError('The value argument must be greater than 0.');
    }

    if(this.encoding === SliceEncoding.slice1) {
        if (value < 255) {
          this.encodeUInt8(Number(value));
        }
        else {
          this.encodeUInt8(255);
          this.encodeInt32(Number(value));
        }
    }
    else {
      this.encodeVarUInt62(BigInt(value));
    }
  }

  public static getVarInt62EncodedSizeExponent(value: number | bigint): number {
    if (value < -(1n << 61n) || value > (1n << 61n) - 1n) {
        throw new InvalidDataException(`The value '${value}' is out of the varint62 range.`);
    }

    const bigIntValue = BigInt(value) << 2n;
    if(bigIntValue >= -(1n << 7n) && bigIntValue < 1n << 7n) {
      return 0; //byte
    } else if(bigIntValue >= -(1n << 15n) && bigIntValue < 1n << 15n) {
      return 1; //short
    } else if(bigIntValue >= -(1n << 31n) && bigIntValue < 1n << 31n) {
      return 2; //int
    }

    return 3; // bigint
  }

  public static getVarUInt62EncodedSizeExponent(value: number | bigint): number {
    if (value < 0) {
        throw new RangeError(`The value '${value}' is out of the varuint62 range.`);
    }

    const bigIntValue = BigInt(value) << 2n;
    if(bigIntValue < 1n << 8n) {
      return 0; //byte
    }
    else if(bigIntValue < 1n << 16n) {
      return 1; //short
    }
    else if(bigIntValue < 1n << 32n) {
      return 2; //int
    }

    return 3; //long
  }

  public static getVarInt62EncodedSize(value: bigint): number {
    return 1 << SliceEncoder.getVarInt62EncodedSizeExponent(value);
  }

  public static getVarUInt62EncodedSize(value: bigint): number {
    return 1 << SliceEncoder.getVarUInt62EncodedSizeExponent(value);
  }

  public encodeVarUInt62(value:bigint) : void {
    const size = SliceEncoder.getVarUInt62EncodedSize(value);
    const encodedSizeExponent:number = SliceEncoder.getVarUInt62EncodedSizeExponent(value);
    value <<= 2n;
    value |= BigInt(encodedSizeExponent);

    switch(size) {
      case 1:
        this.encodeFixedSizeNumeric(value, SliceNumber.byte);
        break;
      case 2:
        this.encodeFixedSizeNumeric(value, SliceNumber.ushort);
        break;
      case 4:
        this.encodeFixedSizeNumeric(value, SliceNumber.uint);
        break;
      default:
        this.encodeFixedSizeNumeric(value, SliceNumber.ulong);
        break;
    }
  }

  public encodeVarUInt32(value:number) : void {
    if(value < 0 || value > 1n << 32n) {
      throw new RangeError(`Value ${value} is out of the range for type VarUInt32`);
    }

    this.encodeVarUInt62(BigInt(value));
  }

  public encodeVarInt62(value:bigint) : void {
    const size = SliceEncoder.getVarInt62EncodedSize(value);
    const encodedSizeExponent:number = SliceEncoder.getVarInt62EncodedSizeExponent(value);
    value <<= 2n;
    value |= BigInt(encodedSizeExponent);

    switch(size) {
      case 1:
        this.encodeFixedSizeNumeric(value, SliceNumber.sbyte);
        break;
      case 2:
        this.encodeFixedSizeNumeric(value, SliceNumber.short);
        break;
      case 4:
        this.encodeFixedSizeNumeric(value, SliceNumber.int);
        break;
      default:
        this.encodeFixedSizeNumeric(value, SliceNumber.long);
        break;
    }
  }

  public encodeVarInt32(value:number) : void {
    if (value < -(1n << 31n) || value >= 1n << 31n) {
        throw new InvalidDataException(`The value '${value}' is out of the varint32 range.`);
    }

    this.encodeVarInt62(BigInt(value));
  }

  public encodeFloat32(value:number) : void {
    this.encodeFixedSizeNumeric(value, SliceNumber.float);
  }

  public encodeFloat64(value:number) : void {
    this.encodeFixedSizeNumeric(value, SliceNumber.double);
  }

  public encodeString(str:string) : void {
    if(str.length === 0) {
      this.encodeSize(0);
    } else {
      const buffer = Buffer.from(str);
      this.encodeSize(buffer.length);
      this._buffer.push(buffer);
      this.advance(buffer.length);

      console.log('Encoding string', str, 'binary length', buffer.length);
    }
  }

  //public encodeTagged
  //
  public encodeTagged<T>(tag:number, v:T,  encodeAction:EncodeAction<T>) : void {
    if (this.encoding == SliceEncoding.slice1)
    {
      //TODO: Encode tagged Slice1 value
      throw new InvalidOperationException("Slice1 encoded tags must be encoded with tag formats.");
    }

    this.encodeVarInt32(tag);

    const startPosition:number = this.encodedByteCount;
    encodeAction(this, v);
    const currentPosition:number = this.encodedByteCount; 

    this.seek(startPosition);
    this.encodeVarUInt62(BigInt(currentPosition - startPosition));
    this.advance(currentPosition);
  }

  //TODO: Implement public encodeTaggedFieldHeader for Slice1   

  public getSizeLength(size:number) : number {
    return this.encoding == SliceEncoding.slice1 ? (size < 255 ? 1 : 5) : SliceEncoder.getVarUInt62EncodedSize(BigInt(size));
  }
  
  public static getBitSequenceByteCount(bitCount:number) : number {
    return (bitCount >> 3) + ((bitCount & 0x07) != 0 ? 1 : 0);
  }
}
