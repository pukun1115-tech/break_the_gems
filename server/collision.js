import {
    CHUNK_SIZE_X,
    CHUNK_SIZE_Y,
    CHUNK_SIZE_Z,

    PLAYER_HIT_X,
    PLAYER_HIT_Y,
    PLAYER_HIT_Y_CROUCH,
    PLAYER_HIT_Z
} from "./config.js";

/** @import { ID, Player } from "./types.js" */
/** @import { Chunk } from "./chunk.js" */

/**
 * @param {Map<string, Chunk>} chunks
 * @param {number} px
 * @param {number} py
 * @param {number} pz
 * @param {boolean} crouch
 * @returns {{
 *     max_x: number,
 *     min_x: number,
 *     max_z: number,
 *     min_z: number
 *     max_y: number,
 *     min_y: number,
 * } | null}
 */
export function check_player_chunk_collision(chunks, px, py, pz, crouch) {
    const p_max_x = px + PLAYER_HIT_X / 2;
    const p_min_x = px - PLAYER_HIT_X / 2;
    const p_max_y = py + (!crouch ? PLAYER_HIT_Y : PLAYER_HIT_Y_CROUCH);
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

                    const b_max_x = c.x + x + 1;
                    const b_min_x = c.x + x;
                    const b_max_z = c.z + z + 1;
                    const b_min_z = c.z + z;
                    const b_max_y = y + 1;
                    const b_min_y = y;

                    const hitX = p_max_x > b_min_x && p_min_x < b_max_x;
                    const hitY = p_max_y > b_min_y && p_min_y < b_max_y;
                    const hitZ = p_max_z > b_min_z && p_min_z < b_max_z;

                    if (hitX && hitY && hitZ) {
                        return {
                            max_x: b_max_x,
                            min_x: b_min_x,
                            max_z: b_max_z,
                            min_z: b_min_z,
                            max_y: b_max_y,
                            min_y: b_min_y
                        };
                    }
                }
            }
        }
    }
    return null;
}

/**
 * @param {Map<string, Chunk>} chunks
 * @param {number} px
 * @param {number} py
 * @param {number} pz
 * @param {boolean} crouch
 * @returns {boolean}
 */
export function is_on_ground(chunks, px, py, pz, crouch) {
    return (check_player_chunk_collision(
        chunks,
        px,
        py - 0.01,
        pz,
        crouch
    ) !== null);
}

/**
 * @param {number} px
 * @param {number} py
 * @param {number} pz
 * @param {Map<ID, Player>} players
 * @param {Player} player
 * @returns {ID | null}
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
