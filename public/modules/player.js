import {
    MOUSE_SENSITIVITY,
} from "./config.js";

const local_player = {
    rot: { x: 0, y: 0, z: 0 },
    FOV: 80,
}

export function get_local_player() {
    return structuredClone(local_player);
}

/**
 * @param {{movement_x: number, movement_y: number}} mouse_inputs
 * @param {Record<string, boolean>} key_inputs
 * @returns {void}
 */
export function player_update(mouse_inputs, key_inputs) {
    //view
    local_player.rot.x = Math.max(-90, Math.min(90, local_player.rot.x + mouse_inputs.movement_y * MOUSE_SENSITIVITY));
    local_player.rot.y = local_player.rot.y - mouse_inputs.movement_x * MOUSE_SENSITIVITY;

    if (key_inputs["KeyN"] === true) {
        local_player.FOV = Math.min(120, local_player.FOV + 1);
    }
    if (key_inputs["KeyM"] === true) {
        local_player.FOV = Math.max(5, local_player.FOV - 1);
    }

    /*
    //break and place block
    if (mouse_inputs.left_click === true) {
        break_block(gl, chunks);
    }
    if (mouse_inputs.right_click === true) {
        place_block(gl, chunks, 1);
    }
    */
}
