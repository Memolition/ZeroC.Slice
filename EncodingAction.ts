import SliceEncoder from "./SliceEncoder.ts"

export type EncodeAction<T> = (encoder: SliceEncoder, value?: T) => void;
