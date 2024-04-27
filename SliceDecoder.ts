import { Buffer } from 'node:buffer';

import { InvalidDataException } from './exceptions/InvalidDataException.ts';
import { InvalidOperationException } from './exceptions/InvalidOperationException.ts';
import { OutOfBoundsException } from './exceptions/OutOfBoundsException.ts';
import { UnimplementedException } from './exceptions/UnimplementedException.ts';

import BufferReader from './BufferReader.ts';
import { DecodeFunc } from './DecodeFunc.ts';
import { SliceEncoding } from './SliceEncoding.ts';
import Slice2Definitions from './Slice2Definitions.ts';
import { TagFormat } from './TagFormat.ts';
import SliceEncoder from './SliceEncoder.ts';

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

    throw new UnimplementedException(`Slice1 decoding not implemented.`);
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

  private static decodeVarInt62Length(from:number) : number {
    return 1 << (from & 0x03);
  }

  private peekByte() : number {
    return this._reader.read(1, true).readUInt8();
  }

  public skip(count:number) : void {
    this._reader.advance(count);
  } 

  public skipSize() {
    if(this.encoding === SliceEncoding.slice1) {
      const chunk:number = this.decodeUInt8();
      if(chunk === 255) {
        this.skip(4);
      } 
    }
    else {
      this.skip(SliceDecoder.decodeVarInt62Length(this.peekByte()))
    }
  }

  public decodeTagged<T>(
    tag: number,
    decodeFunc: DecodeFunc<T>,
    tagFormat?:TagFormat,
    useTagEndMarker?:boolean
  ) : T | undefined {
    if(!tagFormat && this.encoding === SliceEncoding.slice1) {
      throw new InvalidOperationException("Slice1 encoded tags must be decoded with tag formats.");
    }

    if(tagFormat && this.encoding !== SliceEncoding.slice1) {
      throw new InvalidOperationException("Tag formats can only be used with the Slice1 encoding.");
    }

    if(
      this.encoding === SliceEncoding.slice1
      && tagFormat
      && this.decodeTagHeader(tag, tagFormat, !!useTagEndMarker)
    ) {
      if(tagFormat === TagFormat.VSize) {
        this.skipSize();
      } else if(tagFormat === TagFormat.FSize) {
        this.skip(4);
      }

      return decodeFunc(this);

    } else if(this.encoding === SliceEncoding.slice2) {
      const requestedTag:number = tag;

      while (true) {
        const startPos : number = this._reader.getPosition();

        tag = this.decodeVarInt32();

        if (tag === requestedTag) {
            // Found requested tag, so skip size:
            this.skipSize();
            return decodeFunc(this);
        }
        else if (tag == Slice2Definitions.tagEndMarker || tag > requestedTag) {
          this._reader.rewind(this._reader.getPosition() - startPos);
          break;
        }
        else {
          this.skip(this.decodeSize());
        }
      }
    }

    return undefined;
  }

  public getBitSequenceReader(bitSequenceSize:number) : BufferReader {
    if (this.encoding == SliceEncoding.slice1) {
      throw new InvalidOperationException("Cannot create a bit sequence reader using the Slice1 encoding.");
    }

    if (bitSequenceSize <= 0)
    {
        throw new OutOfBoundsException('The bitSequenceSize argument must be greater than 0.');
    }

    const size:number = SliceEncoder.getBitSequenceByteCount(bitSequenceSize);
    const buffer:Buffer = this._reader.getUnreadBuffer(size);
    this._reader.advance(size);
    return new BufferReader(buffer);
  }
  
  public skipTagged(useTagEndMarker:boolean = true) : void {
    if(this.encoding === SliceEncoding.slice1) {
      // TODO: Implement Slice1
      throw new UnimplementedException();
    }
    else {
      while(true) {
        if (this.decodeVarInt32() == Slice2Definitions.tagEndMarker) {
          break;
        }

        this.skip(this.decodeSize());
      }
    }
  }

  private skipTaggedValue(format:TagFormat) : void {
    if(this.encoding !== SliceEncoding.slice1) {
      throw new InvalidDataException("Encoding must be Slice1.");
    }

    switch (format) {
      case TagFormat.F1:
        this.skip(1);
        break;
      case TagFormat.F2:
        this.skip(2);
        break;
      case TagFormat.F4:
        this.skip(4);
        break;
      case TagFormat.F8:
        this.skip(8);
        break;
      case TagFormat.Size:
        this.skipSize();
        break;
      case TagFormat.VSize:
        this.skip(this.decodeSize());
        break;
      case TagFormat.FSize:
        const size:number = this.decodeInt32();
        if (size < 0){
          throw new InvalidDataException(`Decoded invalid size: ${size}.`);
        }

        this.skip(size);
        break;
      default:
        throw new InvalidDataException(`Cannot skip tagged field with tag format '${format}'.`);
      }
    }

  public decodeTagHeader(tag:number, expectedFormat:TagFormat, useTagEndMarker:boolean) : boolean {
    if(this.encoding !== SliceEncoding.slice1) {
      throw new InvalidDataException("Encoding must be Slice1.");
    }

    const requestedTag:number = tag;

    while(true) {
      if(!useTagEndMarker && this._reader.end()) {
        return false;
      }

      const savedPosition:number = this._reader.getPosition();

      const v:number = this.decodeUInt8();
      if(useTagEndMarker && v === Slice2Definitions.tagEndMarker) {
        this._reader.rewind(savedPosition);
        return false;
      }

      const format = v & 0x07 as TagFormat;
      tag = v >> 3;
      if(tag === 30) {
        tag = this.decodeSize();
      }

      if(tag > requestedTag) {
        this._reader.rewind(savedPosition);
        return false;
      }
      else if (tag < requestedTag) {
        this.skipTaggedValue(format);
      }
      else {
        if(expectedFormat === TagFormat.OptimizedVSize) {
          expectedFormat = TagFormat.VSize;
        } 

        if(format != expectedFormat) {
          throw new InvalidDataException(`Invalid tag field '${tag}': unexpected format.`);
        }

        return true;
      }
    }

    return true;
  }
}
