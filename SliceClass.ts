import { List } from 'immutable';
import SliceDecoder from "./SliceDecoder";
import SliceEncoder from "./SliceEncoder";
import SliceInfo from './SliceInfo';

export default abstract class SliceClass {
    public unknownSlices: List<SliceInfo> = List();

    protected decode(decoder: SliceDecoder): void {
        this.decodeCore(decoder);
    }

    protected encode(encoder: SliceEncoder): void {
        this.encodeCore(encoder);
    }

    protected abstract decodeCore(decoder: SliceDecoder): void;
    protected abstract encodeCore(encoder: SliceEncoder): void;
}
