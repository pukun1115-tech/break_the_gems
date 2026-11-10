import {
    CHUNK_SIZE_X,
    CHUNK_SIZE_Y,
    CHUNK_SIZE_Z,

    PLAYER_HIT_X,
    PLAYER_HIT_Y,
    PLAYER_HIT_Z
} from "./config.js";


/**
 * @param {Map<string, Chunk>} chunks
 * @param {number} px
 * @param {number} py
 * @param {number} pz
 * @returns {boolean}
 */
export function check_player_chunk_collision(chunks, px, py, pz) {
    const p_max_x = px + PLAYER_HIT_X / 2;
    const p_min_x = px - PLAYER_HIT_X / 2;
    const p_max_y = py + PLAYER_HIT_Y;
    const p_min_y = py;
    const p_max_z = pz + PLAYER_HIT_Z / 2;
    const p_min_z = pz - PLAYER_HIT_Z / 2;
    for (const c of chunks.values()) {
        if (
            c.x > p_max_x ||
            c.x + CHUNK_SIZE_X < p_min_x ||
            c.z > p_max_z ||
            c.z + CHUNK_SIZE_Z < p_min_z
        ) {
            continue;
        }
        for (let x = 0; x < CHUNK_SIZE_X; x++) {
            for (let y = 0; y < CHUNK_SIZE_Y; y++) {
                for (let z = 0; z < CHUNK_SIZE_Z; z++) {
                    if (c.map[x][y][z].type === 0) {
                        continue;
                    }

                    const b_maxX = c.x + x + 1;
                    const b_minX = c.x + x;
                    const b_maxZ = c.z + z + 1;
                    const b_minZ = c.z + z;
                    const b_maxY = y + 1;
                    const b_minY = y;

                    const hitX = p_max_x > b_minX && p_min_x < b_maxX;
                    const hitY = p_max_y > b_minY && p_min_y < b_maxY;
                    const hitZ = p_max_z > b_minZ && p_min_z < b_maxZ;

                    if (hitX && hitY && hitZ) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

export function is_on_ground(chunks, px, py, pz) {
    return check_player_chunk_collision(chunks, px, py - 0.01, pz);
}

/**
 * @param {number} px
 * @param {number} py
 * @param {number} pz
 * @param {Map<string, { pos: { x: number, y: number, z: number }, id: string }>} players
 * @param {{ pos: { x: number, y: number, z: number }, id: string, team: string }} player
 * @returns {string | null}
 */
export function check_point_player_collision(px, py, pz, players, player) {
    for (const p of players.values()) {
        if (p.id === player.id) {
            continue;
        }
        if (p.team === player.team) {
            continue;
        }
        if (
            px >= p.pos.x - PLAYER_HIT_X / 2 &&
            px <= p.pos.x + PLAYER_HIT_X / 2 &&
            py >= p.pos.y &&
            py <= p.pos.y + PLAYER_HIT_Y &&
            pz >= p.pos.z - PLAYER_HIT_Z / 2 &&
            pz <= p.pos.z + PLAYER_HIT_Z / 2
        ) {
            return p.id;
        }
    }
    return null;
}