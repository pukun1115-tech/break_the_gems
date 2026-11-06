import { deg2rad, rotate_vector_ZYX } from "./rotation.js";
import { MOUSE_SENSITIVITY, CHUNK_SIZE_X, CHUNK_SIZE_Y, CHUNK_SIZE_Z, PLAYER_MOVE_SPEED, GRAVITY, PLAYER_JUMP_HEIGHT } from "./config.js";
import { Chunk, get_chunk_key } from "./chunk.js";

const player = {
    pos: { x: 0, y: 40, z: 0 },
    rot: { x: 0, y: 0, z: 0 },
    FOV: 80,
    velocity_y: 0
};

export function get_player() {
    return structuredClone(player);
}

/**
 * @param {Map<string, Chunk>} chunks
 * @param {number} px
 * @param {number} py
 * @param {number} pz
 * @returns {boolean}
 */
function check_player_chunk_collision(chunks, px, py, pz) {
    const p_max_x = px + 0.3;
    const p_min_x = px - 0.3;
    const p_max_y = py + 1.8;
    const p_min_y = py;
    const p_max_z = pz + 0.3;
    const p_min_z = pz - 0.3;
    for (const c of chunks.values()) {
        if (c.x > p_max_x || c.x + CHUNK_SIZE_X < p_min_x || c.z > p_max_z || c.z + CHUNK_SIZE_Z < p_min_z) {
            continue;
        }
        for (let x = 0; x < CHUNK_SIZE_X; x++) {
            for (let y = 0; y < CHUNK_SIZE_Y; y++) {
                for (let z = 0; z < CHUNK_SIZE_Z; z++) {
                    if (c.map[x][y][z] === 0) {
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

function is_on_ground(chunks, px, py, pz) {
    return check_player_chunk_collision(chunks, px, py - 0.01, pz);
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {Record<string, Chunk>} chunks
 * @returns {void}
 */
function break_block(gl, chunks) {
    const rot_x = deg2rad(player.rot.x);
    const rot_y = deg2rad(player.rot.y);
    const rot_z = deg2rad(player.rot.z);

    const direction = rotate_vector_ZYX({ x: 0, y: 0, z: 1 }, { x: -rot_x, y: -rot_y, z: -rot_z });
    
    const ray_step = 0.05;
    const max_distance = 4;

    for (let distance = 0; distance <= max_distance; distance += ray_step) {
        const ray_x = player.pos.x + direction.x * distance;
        const ray_y = player.pos.y + 1.6 + direction.y * distance;
        const ray_z = player.pos.z + direction.z * distance;

        const world_x = Math.floor(ray_x);
        const world_y = Math.floor(ray_y);
        const world_z = Math.floor(ray_z);

        const chunk_x = Math.floor(world_x / CHUNK_SIZE_X);
        const chunk_z = Math.floor(world_z / CHUNK_SIZE_Z);

        const target_chunk = chunks.get(get_chunk_key(chunk_x, chunk_z));
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
        target_chunk.generate_mesh(gl);
        break;
    }
}

function place_block(chunks) {
    //
}


/**
 * @param {Map<string, Chunk>} chunks
 * @param {{movement_x: number, movement_y: number}} mouse_inputs
 * @param {Record<string, boolean>} key_inputs
 * @param {number} delta_time
 * @returns {void}
 */
export function player_update(chunks, mouse_inputs, key_inputs, delta_time) {
    const cosy = Math.cos(deg2rad(player.rot.y));
    const siny = Math.sin(deg2rad(player.rot.y));

    let next_x = player.pos.x;
    let next_y = player.pos.y;
    let next_z = player.pos.z;

    if (key_inputs["KeyW"] === true) {
        next_x += PLAYER_MOVE_SPEED * delta_time * siny;
        next_z += PLAYER_MOVE_SPEED * delta_time * cosy;
    }
    if (key_inputs["KeyS"] === true) {
        next_x += -PLAYER_MOVE_SPEED * delta_time * siny;
        next_z += -PLAYER_MOVE_SPEED * delta_time * cosy;
    }
    if (key_inputs["KeyA"] === true) {
        next_x += PLAYER_MOVE_SPEED * delta_time * cosy;
        next_z += -PLAYER_MOVE_SPEED * delta_time * siny;
    }
    if (key_inputs["KeyD"] === true) {
        next_x += -PLAYER_MOVE_SPEED * delta_time * cosy;
        next_z += PLAYER_MOVE_SPEED * delta_time * siny;
    }

    if (!check_player_chunk_collision(chunks, next_x, player.pos.y, player.pos.z)) {
        player.pos.x = next_x;
    }
    if (!check_player_chunk_collision(chunks, player.pos.x, player.pos.y, next_z)) {
        player.pos.z = next_z;
    }

    const on_ground = is_on_ground(chunks, player.pos.x, player.pos.y, player.pos.z);

    player.velocity_y -= GRAVITY * delta_time;

    if (on_ground) {
        player.velocity_y = 0;
        
        if(key_inputs["Space"] === true) {
            player.velocity_y = Math.sqrt(2 * GRAVITY * PLAYER_JUMP_HEIGHT);
        } 
    }

    next_y = player.pos.y + player.velocity_y * delta_time;

    if (player.velocity_y !== 0) {
        const scale = (player.velocity_y > 0 ? -0.005 : 0.005);
        while (check_player_chunk_collision(chunks, player.pos.x, next_y, player.pos.z)) {
            player.velocity_y = 0;
            next_y += scale;
        }
    }

    player.pos.y = next_y;
    
    player.rot.x = Math.max(-90, Math.min(90, player.rot.x + mouse_inputs.movement_y * MOUSE_SENSITIVITY));
    player.rot.y = player.rot.y - mouse_inputs.movement_x * MOUSE_SENSITIVITY;

    if (key_inputs["KeyN"] === true) {
        player.FOV = Math.min(120, player.FOV + 1);
    }
    if (key_inputs["KeyM"] === true) {
        player.FOV = Math.max(5, player.FOV - 1);
    }
}
