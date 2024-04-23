import SliceClass from "./SliceClass";

export default class SliceInfo {
  constructor(
    public typeId:string,
    public bytes:Buffer,
    public hasTaggedFields:boolean,
    public instances:SliceClass[],
  ) {}
}
