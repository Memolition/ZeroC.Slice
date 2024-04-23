import { SliceEncoding } from "./SliceEncoding";

export default class SliceEncoder {
  public buffer:Buffer;

  constructor(
    public encoding:SliceEncoding = SliceEncoding.slice2,
  ) {
    this.buffer = Buffer.alloc(0);
  }
}
