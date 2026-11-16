import {
    CHUNK_SIZE_X,
    CHUNK_SIZE_Y,
    CHUNK_SIZE_Z
} from "./config.js";

/** import { Block } from "./types.js" */

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
        /** @type {Array<Array<Array<Block>>>} */
        this.map = Array.from({ length: CHUNK_SIZE_X }, () => {
            return Array.from({ length: CHUNK_SIZE_Y }, () => {
                return Array.from({ length: CHUNK_SIZE_Z }, () => {
                    return {
                        type: 0,
                        stage: 0
                    };
                });
            });
        });
    }

    fill_map(fill_type) {
        for (let x = 0; x < CHUNK_SIZE_X; x++) {
            for (let y = 0; y < CHUNK_SIZE_Y; y++) {
                for (let z = 0; z < CHUNK_SIZE_Z; z++) {
                    this.map[x][y][z] = {
                        type: fill_type,
                        stage: 8
                    };
                }
            }
        }
    }

    set_block(set_type, set_stage, x, y, z) {
        this.map[x][y][z] = {
            type: set_type,
            stage: set_stage
        };
    }
}
