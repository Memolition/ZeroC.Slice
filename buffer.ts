import { Buffer } from 'node:buffer';
import { Readable } from 'node:stream';

const buf = Buffer.alloc(4);
buf.write('000102F0', 0, 4, 'hex');
//const buf = Buffer.from('000102F0', 'hex');

console.log('byte 1', buf.readUint8());
console.log('byte 2', buf.readUint8());
