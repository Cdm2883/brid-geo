import { Vec3 } from "vec3";

export default class Vector3 extends Vec3 {
    static get Unspecified() {
        return new Vector3(NaN, NaN, NaN);
    }
    static from(x: number, y: number, z: number) {
        return new Vector3(x, y, z);
    }
    private constructor(x: number, y: number, z: number) {
        super(x, y, z);
    }

    // transformRelative
    // transformLocal

    toObject() {
        return { x: this.x, y: this.y, z: this. z };
    }
}
