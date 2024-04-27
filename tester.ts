import { Buffer } from 'node:buffer';
import { Readable } from 'node:stream';

import SliceDecoder from './SliceDecoder.ts';
import SliceEncoder from './SliceEncoder.ts';

//TODO: Write tests

function decode(buffer?:Buffer) {
  //const contents = "6666ae40";
  //const contents = "FDFFFEFF0050FFFF00F000000050";
  //const contents = "0CFDFFFEFFFFFFFFFFFFFFFFFFFFFF"; //UVarint
  if(!buffer) {
    const contents = "3048656C6C6F20776F726C6421"; //String
    buffer = Buffer.from(contents, 'hex');
  }

  const decoder = new SliceDecoder(buffer);
  console.log(decoder.decodeString(), 'String Hello World');
  console.log(decoder.decodeString(), 'String <Empty>');

  console.log(decoder.decodeBool(), 'Bool true');
  console.log(decoder.decodeUInt8(), 'UInt8 255');
  console.log(decoder.decodeVarUInt62(), 'VarUInt62 63');
  console.log(decoder.decodeVarUInt62(), 'VarUInt62 255');
  console.log(decoder.decodeVarUInt62(), 'VarUInt62 16383');
  console.log(decoder.decodeVarUInt62(), 'VarUInt62 16384');
  console.log(decoder.decodeVarUInt62(), 'VarUInt62 4611686018427387903');

  console.log(decoder.decodeVarInt62(), 'VarInt62 63');
  console.log(decoder.decodeVarInt62(), 'VarInt62 255');
  console.log(decoder.decodeVarInt62(), 'VarInt62 16383');
  console.log(decoder.decodeVarInt62(), 'VarInt62 16384');
  console.log(decoder.decodeVarInt62(), 'VarInt62 2305843009213693951n');
  console.log(decoder.decodeVarInt62(), 'VarInt62 -2305843009213693952n');

  console.log(decoder.decodeFloat32(), 'Float32 10.5');
  console.log(decoder.decodeFloat64(), 'Float64 56294995342131.5');
}

function encode() {
  const encoder = new SliceEncoder();

  encoder.encodeString('Hello World');
  encoder.encodeString('');

  encoder.encodeBool(true);
  encoder.encodeUInt8(255);
  encoder.encodeVarUInt62(BigInt(63));
  encoder.encodeVarUInt62(BigInt(255));
  encoder.encodeVarUInt62(BigInt(16383));
  encoder.encodeVarUInt62(BigInt(16384));
  encoder.encodeVarUInt62(BigInt(4_611_686_018_427_387_903n));

  encoder.encodeVarInt62(BigInt(63));
  encoder.encodeVarInt62(BigInt(255));
  encoder.encodeVarInt62(BigInt(16383));
  encoder.encodeVarInt62(BigInt(16384));
  encoder.encodeVarInt62(2305843009213693951n);
  encoder.encodeVarInt62(-2305843009213693952n);

  encoder.encodeFloat32(10.5);
  encoder.encodeFloat64(56294995342132.5);

  const buffer = encoder.getBuffer();
  console.log('Raw buffer', buffer);

  console.log('Attempting to decode');
  decode(buffer);
}

encode();
