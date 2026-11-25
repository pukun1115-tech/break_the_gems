import {
    CHUNK_SIZE_X,
    CHUNK_SIZE_Y,
    CHUNK_SIZE_Z,

    BOMB_DISTANCE
} from "./config.js";

/** import { Block } from "./types.js" */
/** import { Game } from "./game.js" */

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
 * @returns {{x: number, z: number}} 
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

export function create_initial_chunks() {
    const chunks = new Map();

    const c00 = new Chunk(0, 0);
    c00.fill_map(6);
    for (let x = 0; x < CHUNK_SIZE_X; x++) {
        for (let y = 0; y < CHUNK_SIZE_Y; y++) {
            c00.set_block(1, 8, x, y, 0);
        }
    }
    for (let z = 0; z < CHUNK_SIZE_Z; z++) {
        for (let y = 0; y < CHUNK_SIZE_Y; y++) {
            c00.set_block(1, 8, 0, y, z);
        }
    }
    for (let x = 0; x < CHUNK_SIZE_X; x++) {
        for (let z = 0; z < CHUNK_SIZE_Z; z++) {
            c00.set_block(1, 8, x, CHUNK_SIZE_Y - 1, z);
            c00.set_block(1, 8, x, 0, z);
        }
    }

    for (let x = 1; x <= 3; x++) {
        for (let y = 16; y <= 18; y++) {
            for (let z = 1; z <= 3; z++) {
                    c00.set_block(0, 0, x, y, z);
            }
        }
    }
    for (let x = 2; x <= 3; x++) {
        for (let y = 16; y <= 17; y++) {
            for (let z = 2; z <= 3; z++) {
                c00.set_block(3, 8, x, y, z);
            }
        }
    }
    chunks.set(get_chunk_key(0, 0), c00);

    const c01 = new Chunk(0, 1);
    c01.fill_map(6);
    for (let x = 0; x < CHUNK_SIZE_X; x++) {
        for (let y = 0; y < CHUNK_SIZE_Y; y++) {
            c01.set_block(1, 8, x, y, CHUNK_SIZE_Z - 1);
        }
    }
    for (let z = 0; z < CHUNK_SIZE_Z; z++) {
        for (let y = 0; y < CHUNK_SIZE_Y; y++) {
            c01.set_block(1, 8, 0, y, z);
        }
    }
    for (let x = 0; x < CHUNK_SIZE_X; x++) {
        for (let z = 0; z < CHUNK_SIZE_Z; z++) {
            c01.set_block(1, 8, x, CHUNK_SIZE_Y - 1, z);
            c01.set_block(1, 8, x, 0, z);
        }
    }
    chunks.set(get_chunk_key(0, 1), c01);

    const c10 = new Chunk(1, 0);
    c10.fill_map(6);
    for (let x = 0; x < CHUNK_SIZE_X; x++) {
        for (let y = 0; y < CHUNK_SIZE_Y; y++) {
            c10.set_block(1, 8, x, y, 0);
        }
    }
    for (let z = 0; z < CHUNK_SIZE_Z; z++) {
        for (let y = 0; y < CHUNK_SIZE_Y; y++) {
            c10.set_block(1, 8, CHUNK_SIZE_X - 1, y, z);
        }
    }
    for (let x = 0; x < CHUNK_SIZE_X; x++) {
        for (let z = 0; z < CHUNK_SIZE_Z; z++) {
            c10.set_block(1, 8, x, CHUNK_SIZE_Y - 1, z);
            c10.set_block(1, 8, x, 0, z);
        }
    }
    chunks.set(get_chunk_key(1, 0), c10);

    const c11 = new Chunk(1, 1);
    c11.fill_map(6);
    for (let x = 0; x < CHUNK_SIZE_X; x++) {
        for (let y = 0; y < CHUNK_SIZE_Y; y++) {
            c11.set_block(1, 8, x, y, CHUNK_SIZE_Z - 1);
        }
    }
    for (let z = 0; z < CHUNK_SIZE_Z; z++) {
        for (let y = 0; y < CHUNK_SIZE_Y; y++) {
            c11.set_block(1, 8, CHUNK_SIZE_X - 1, y, z);
        }
    }
    for (let x = 0; x < CHUNK_SIZE_X; x++) {
        for (let z = 0; z < CHUNK_SIZE_Z; z++) {
            c11.set_block(1, 8, x, CHUNK_SIZE_Y - 1, z);
            c11.set_block(1, 8, x, 0, z);
        }
    }

    for (let x = 12; x <= 14; x++) {
        for (let y = 16; y <= 18; y++) {
            for (let z = 12; z <= 14; z++) {
                c11.set_block(0, 0, x, y, z);
            }
        }
    }
    for (let x = 12; x <= 13; x++) {
        for (let y = 16; y <= 17; y++) {
            for (let z = 12; z <= 13; z++) {
                c11.set_block(5, 8, x, y, z);
            }
        }
    }
    chunks.set(get_chunk_key(1, 1), c11);
    
    return chunks;
}

/**
 * @param{Map<string, Chunk>>} chunks
 * @param {string} chunk_key
 * @param {Vec3} local_pos
 * @param {Game.broadcast} broadcast
 */
export function explode_bomb(chunks, chunk_key, bomb_pos, broadcast) {
    const { x: lcx, z: lcz } = parse_chunk_key(chunk_key);
    const wx = bomb_pos.x + lcx * CHUNK_SIZE_X;
    const wy = bomb_pos.y;
    const wz = bomb_pos.z + lcz * CHUNK_SIZE_Z;

    for (let x = wx - BOMB_DISTANCE; x <= wx + BOMB_DISTANCE; x++) {
        const dx = x - wx;
        for (let y = wy - BOMB_DISTANCE; y <= wy + BOMB_DISTANCE; y++) {
            const dy = y - wy;
            for (let z = wz - BOMB_DISTANCE; z <= wz + BOMB_DISTANCE; z++) {
                const dz = z - wz;
                
                const dist = dx * dx + dy * dy + dz * dz;

                if (dist <= BOMB_DISTANCE * BOMB_DISTANCE) {
                    const cx = Math.floor(x / CHUNK_SIZE_X);
                    const cz = Math.floor(z / CHUNK_SIZE_Z);
                    const c_key = get_chunk_key(cx, cz);

                    const target = chunks.get(c_key);
                    if (target === undefined) {
                        continue;
                    }
                    
                    const lx = x - cx * CHUNK_SIZE_X;
                    const lz = z - cz * CHUNK_SIZE_Z;
                    if (
                        target.map[lx][y][lz].type === 0 ||
                        target.map[lx][y][lz].type === 1 ||
                        target.map[lx][y][lz].type === 3 ||
                        target.map[lx][y][lz].type === 5
                    ) {
                        continue;
                    }
                    target.set_block(0, 0, lx, y, lz);
                    broadcast(JSON.stringify({
                        type: "update_map",
                        chunk_key: c_key,
                        pos: { x: lx, y: y, z: lz },
                        block: { type: 0, stage: 0 }
                    }));
                }
            }
        }
    }
}
