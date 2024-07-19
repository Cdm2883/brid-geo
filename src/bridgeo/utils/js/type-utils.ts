/* eslint-disable @typescript-eslint/no-explicit-any */
export type Enumerate<T extends number, R extends number[] = []> = R['length'] extends T
    ? R[number]
    : Enumerate<T, [R['length'], ...R]>

export type RangeInteger<Min extends number, Max extends number> = Exclude<Enumerate<Max>, Enumerate<Min>>

export type ArrayIndexes<T extends any[]> = T extends { length: infer L extends number } ? Enumerate<L> : never;
export type ArrayStringifyIndexes<T extends any[]> = Exclude<keyof T, keyof any[]>;

export type ArrayShift<T extends any[]> = T extends [unknown, ...infer Rest] ? Rest : never;
