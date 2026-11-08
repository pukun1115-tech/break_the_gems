import { CHUNK_SIZE_X, CHUNK_SIZE_Y, CHUNK_SIZE_Z } from "./config.js";

/**
 * @param {number} x
 * @param {number} z
 * @returns {string}
 */
export function get_chunk_key(x, z) {
    return `${x}_${z}`;
}

/**
 * @param {string} key
 * @returns {{x: number, y: number}} 
 */
export function parse_chunk_key(key) {
    const [str_x, str_z] = key.split("_");
    return {
        x: Number(str_x),
        z: Number(str_z)
    };
}

export class Chunk {
    constructor(x, z) {
        this.x = x * CHUNK_SIZE_X;
        this.z = z * CHUNK_SIZE_Z;
        /** @type {Array<Array<Array<{ type: number, stage: number}>>> | null} */
        this.map = null;
    }

    create_map() {
        this.map = new Array(CHUNK_SIZE_X);
        for (let x = 0; x < CHUNK_SIZE_X; x++) {
            this.map[x] = new Array(CHUNK_SIZE_Y);
            for (let y = 0; y < CHUNK_SIZE_Y; y++) {
                this.map[x][y] = Array.from({ length: CHUNK_SIZE_Z }, () => ({ type: 2, stage: 8 }));
            }
        }
    }
}