import { CHUNK_SIZE_X, CHUNK_SIZE_Y, CHUNK_SIZE_Z } from "./config.js";
import { deg2rad, rotate_vector_XYZ } from "./rotation.js";
import { Chunk, get_chunk_key } from "./chunk.js";
import { check_player_chunk_collision } from "./collision.js";


/**
 * @param {Map<string, Chunk>} chunks
 * @param {{pos: { x: number, y: number, z: number }, rot: { x: number, y: number, z: number }}} player
 * @returns {{ chunk_key: string, pos: { x: number, y: number, z: number } } | null}
 */
export function break_block(chunks, player) {
    const rot_x = deg2rad(player.rot.x);
    const rot_y = deg2rad(player.rot.y);
    const rot_z = deg2rad(player.rot.z);

    const direction = rotate_vector_XYZ({ x: 0, y: 0, z: 1 }, { x: rot_x, y: rot_y, z: rot_z });

    const ray_step = 0.05;
    const max_distance = 40;

    for (let distance = 0; distance <= max_distance; distance += ray_step) {
        const ray_x = player.pos.x + direction.x * distance;
        const ray_y = player.pos.y + 1.6 + direction.y * distance;
        const ray_z = player.pos.z + direction.z * distance;

        const world_x = Math.floor(ray_x);
        const world_y = Math.floor(ray_y);
        const world_z = Math.floor(ray_z);

        const chunk_x = Math.floor(world_x / CHUNK_SIZE_X);
        const chunk_z = Math.floor(world_z / CHUNK_SIZE_Z);
        const chunk_key = get_chunk_key(chunk_x, chunk_z);

        const target_chunk = chunks.get(chunk_key);
        if (target_chunk === undefined) {
            continue;
        }

        const local_x = world_x - target_chunk.x;
        const local_y = world_y;
        const local_z = world_z - target_chunk.z;

        if (local_y < 0 || local_y >= CHUNK_SIZE_Y) {
            continue;
        }
        if (target_chunk.map[local_x][local_y][local_z] === 0) {
            continue;
        }

        target_chunk.map[local_x][local_y][local_z] = 0;
        return { chunk_key: chunk_key, pos: { x: local_x, y: local_y, z: local_z } };
    }
    return null;
}

/**
 * @param {Map<string, Chunk>} chunks
 * @param {any} players
 * @param {{pos: { x: number, y: number, z: number }, rot: { x: number, y: number, z: number }}} player
 * @param {number} type
 * @returns {{ chunk_key: string, pos: { x: number, y: number, z: number } } | null}
 */
export function place_block(chunks, players, player, type) {
    const rot_x = deg2rad(player.rot.x);
    const rot_y = deg2rad(player.rot.y);
    const rot_z = deg2rad(player.rot.z);

    const direction = rotate_vector_XYZ({ x: 0, y: 0, z: 1 }, { x: rot_x, y: rot_y, z: rot_z });

    let previous_x = null;
    let previous_y = null;
    let previous_z = null;
    const ray_step = 0.05;
    const max_distance = 40;

    for (let distance = 0; distance <= max_distance; distance += ray_step) {
        const ray_x = player.pos.x + direction.x * distance;
        const ray_y = player.pos.y + 1.6 + direction.y * distance;
        const ray_z = player.pos.z + direction.z * distance;

        const hit_block_x = Math.floor(ray_x);
        const hit_block_y = Math.floor(ray_y);
        const hit_block_z = Math.floor(ray_z);

        const hit_chunk_x = Math.floor(hit_block_x / CHUNK_SIZE_X);
        const hit_chunk_z = Math.floor(hit_block_z / CHUNK_SIZE_Z);
        const hit_chunk = chunks.get(get_chunk_key(hit_chunk_x, hit_chunk_z));
        if (hit_chunk === undefined) {
            continue;
        }

        const hit_local_x = hit_block_x - hit_chunk.x;
        const hit_local_y = hit_block_y;
        const hit_local_z = hit_block_z - hit_chunk.z;

        if (
            hit_local_y >= 0 &&
            hit_local_y < CHUNK_SIZE_Y &&
            hit_chunk.map[hit_local_x][hit_local_y][hit_local_z] !== 0
        ) {
            if (previous_x === null || previous_y === null || previous_z === null) {
                break;
            }
            const place_chunk_x = Math.floor(previous_x / CHUNK_SIZE_X);
            const place_chunk_z = Math.floor(previous_z / CHUNK_SIZE_Z);
            const chunk_key = get_chunk_key(place_chunk_x, place_chunk_z);

            const place_chunk = chunks.get(chunk_key);
            if (place_chunk === undefined) {
                break;
            }

            const place_local_x = previous_x - place_chunk.x;
            const place_local_y = previous_y
            const place_local_z = previous_z - place_chunk.z;
            if (place_local_y < 0 || place_local_y >= CHUNK_SIZE_Y) {
                break;
            }
            if (place_chunk.map[place_local_x][place_local_y][place_local_z] !== 0) {
                break;
            }

            place_chunk.map[place_local_x][place_local_y][place_local_z] = type;
            let hit = false;
            for (const p of players) {
                if (check_player_chunk_collision(chunks, p.pos.x, p.pos.y, p.pos.z)) {
                    place_chunk.map[place_local_x][place_local_y][place_local_z] = 0;
                    hit = true;
                    break;
                }
            }
            if (hit) {
                break;
            }
            return { chunk_key: chunk_key, pos: { x: place_local_x, y: place_local_y, z: place_local_z } };
        }
        previous_x = hit_block_x;
        previous_y = hit_block_y;
        previous_z = hit_block_z;
    }
    return null;
}