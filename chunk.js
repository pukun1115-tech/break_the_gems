import { create_ibo, create_vbo } from "./gl_functions.js";
import { CHUNK_SIZE_X, CHUNK_SIZE_Y, CHUNK_SIZE_Z, BLOCK_TEXTURECOORD } from "./config.js";

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
    constructor(gl, x, z) {
        this.x = x * CHUNK_SIZE_X;
        this.z = z * CHUNK_SIZE_Z;
        this.map = null;

        this.index_count = 0;
        this.ibo = null;
        this.position_vbo = null;
        this.color_vbo = null;
        this.texture_coord_vbo = null;
        this.generate_map();
        this.generate_mesh(gl);
    }

    generate_map() {
        this.map = new Array(CHUNK_SIZE_X);
        for (let x = 0; x < CHUNK_SIZE_X; x++) {
            this.map[x] = new Array(CHUNK_SIZE_Y);
            for (let y = 0; y < CHUNK_SIZE_Y; y++) {
                this.map[x][y] = new Array(CHUNK_SIZE_Z).fill(3);
            }
        }
    }

    /**
     * @param {WebGLRenderingContext} gl
     * @returns {void}
     */
    generate_mesh(gl) {
        let index_offset = 0;
        /** @type {Array<number>} */
        let pos = [];
        /** @type {Array<number>} */
        let idx = [];
        /** @type {Array<number>} */
        let tex_coord = [];
        /** @type {Array<number>} */
        let col = [];

        for (let x = 0; x < CHUNK_SIZE_X; x++) {
            for (let y = 0; y < CHUNK_SIZE_Y; y++) {
                for (let z = 0; z < CHUNK_SIZE_Z; z++) {
                    if (this.isAir(x, y, z)) {
                        continue;
                    }
                    const world_X = x + this.x;
                    const world_z = z + this.z;

                    if (this.isAir(x, y, z + 1)) {
                        pos.push(world_X, y, world_z + 1);
                        pos.push(world_X + 1, y, world_z + 1);
                        pos.push(world_X + 1, y + 1, world_z + 1);
                        pos.push(world_X, y + 1, world_z + 1);

                        idx.push(index_offset + 0, index_offset + 1, index_offset + 2);
                        idx.push(index_offset + 0, index_offset + 2, index_offset + 3);
                        index_offset += 4;
                        this.index_count += 6;

                        tex_coord.push(...BLOCK_TEXTURECOORD[this.map[x][y][z]]["front"]);

                        col.push(1, 1, 1, 1);
                        col.push(1, 1, 1, 1);
                        col.push(1, 1, 1, 1);
                        col.push(1, 1, 1, 1);
                    }

                    if (this.isAir(x, y, z - 1)) {
                        pos.push(world_X + 1, y, world_z
                        );
                        pos.push(world_X, y, world_z
                        );
                        pos.push(world_X, y + 1, world_z
                        );
                        pos.push(world_X + 1, y + 1, world_z
                        );

                        idx.push(index_offset + 0, index_offset + 1, index_offset + 2);
                        idx.push(index_offset + 0, index_offset + 2, index_offset + 3);
                        index_offset += 4;
                        this.index_count += 6;

                        tex_coord.push(...BLOCK_TEXTURECOORD[this.map[x][y][z]]["back"]);

                        col.push(1, 1, 1, 1);
                        col.push(1, 1, 1, 1);
                        col.push(1, 1, 1, 1);
                        col.push(1, 1, 1, 1);
                    }

                    if (this.isAir(x + 1, y, z)) {
                        pos.push(world_X + 1, y, world_z + 1);
                        pos.push(world_X + 1, y, world_z
                        );
                        pos.push(world_X + 1, y + 1, world_z
                        );
                        pos.push(world_X + 1, y + 1, world_z + 1);

                        idx.push(index_offset + 0, index_offset + 1, index_offset + 2);
                        idx.push(index_offset + 0, index_offset + 2, index_offset + 3);
                        index_offset += 4;
                        this.index_count += 6;

                        tex_coord.push(...BLOCK_TEXTURECOORD[this.map[x][y][z]]["right"]);

                        col.push(1, 1, 1, 1);
                        col.push(1, 1, 1, 1);
                        col.push(1, 1, 1, 1);
                        col.push(1, 1, 1, 1);
                    }

                    if (this.isAir(x - 1, y, z)) {
                        pos.push(world_X, y, world_z
                        );
                        pos.push(world_X, y, world_z + 1);
                        pos.push(world_X, y + 1, world_z + 1);
                        pos.push(world_X, y + 1, world_z
                        );

                        idx.push(index_offset + 0, index_offset + 1, index_offset + 2);
                        idx.push(index_offset + 0, index_offset + 2, index_offset + 3);
                        index_offset += 4;
                        this.index_count += 6;

                        tex_coord.push(...BLOCK_TEXTURECOORD[this.map[x][y][z]]["left"]);

                        col.push(1, 1, 1, 1);
                        col.push(1, 1, 1, 1);
                        col.push(1, 1, 1, 1);
                        col.push(1, 1, 1, 1);
                    }

                    if (this.isAir(x, y + 1, z)) {
                        pos.push(world_X, y + 1, world_z + 1);
                        pos.push(world_X + 1, y + 1, world_z + 1);
                        pos.push(world_X + 1, y + 1, world_z
                        );
                        pos.push(world_X, y + 1, world_z
                        );

                        idx.push(index_offset + 0, index_offset + 1, index_offset + 2);
                        idx.push(index_offset + 0, index_offset + 2, index_offset + 3);
                        index_offset += 4;
                        this.index_count += 6;

                        tex_coord.push(...BLOCK_TEXTURECOORD[this.map[x][y][z]]["top"]);

                        col.push(1, 1, 1, 1);
                        col.push(1, 1, 1, 1);
                        col.push(1, 1, 1, 1);
                        col.push(1, 1, 1, 1);
                    }

                    if (this.isAir(x, y - 1, z)) {
                        pos.push(world_X, y, world_z
                        );
                        pos.push(world_X + 1, y, world_z
                        );
                        pos.push(world_X + 1, y, world_z + 1);
                        pos.push(world_X, y, world_z + 1);

                        idx.push(index_offset + 0, index_offset + 1, index_offset + 2);
                        idx.push(index_offset + 0, index_offset + 2, index_offset + 3);
                        index_offset += 4;
                        this.index_count += 6;

                        tex_coord.push(...BLOCK_TEXTURECOORD[this.map[x][y][z]]["bottom"]);

                        col.push(1, 1, 1, 1);
                        col.push(1, 1, 1, 1);
                        col.push(1, 1, 1, 1);
                        col.push(1, 1, 1, 1);
                    }
                }
            }
        }

        this.ibo = create_ibo(gl, idx);
        if (this.ibo === null) {
            throw new Error("create_ibo");
        }

        this.position_vbo = create_vbo(gl, pos);
        this.color_vbo = create_vbo(gl, col);
        this.texture_coord_vbo = create_vbo(gl, tex_coord);
        if (this.position_vbo === null || this.color_vbo === null || this.texture_coord_vbo === null) {
            throw new Error("create_vbo");
        }
    }

    isAir(x, y, z) {
        if (x < 0 || y < 0 || z < 0 || x >= CHUNK_SIZE_X || y >= CHUNK_SIZE_Y || z >= CHUNK_SIZE_Z) {
            return true;
        }
        return (this.map[x][y][z] === 0);
    }
}