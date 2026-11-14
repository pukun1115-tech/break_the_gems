import {
    MOUSE_SENSITIVITY,
    SERVER_FPS,
} from "./config.js";

const local_player = {
    rot: { x: 0, y: 0, z: 0 },
    FOV: 80,
}

export function get_local_player() {
    return structuredClone(local_player);
}

export function set_local_player_rot(player) {
    local_player.rot = player.rot;
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
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

export function get_interpolated_players(now, snapshots, players) {
    if (snapshots.length === 0) {
        return Array.from(players.values());
    }

    const render_time = now - (1000 / SERVER_FPS);

    let previous = snapshots[0];
    let next = snapshots[snapshots.length - 1];
    for (let i = 0; i < snapshots.length - 1; i++) {
        if (
            snapshots[i].received_at <= render_time &&
            render_time <= snapshots[i + 1].received_at
        ) {
            previous = snapshots[i];
            next = snapshots[i + 1];
            break;
        }
    }

    const duration = next.received_at - previous.received_at;
    const alpha = (duration <= 0 ? 0 : Math.max(0, Math.min(1, (render_time - previous.received_at) / duration)));
    const previous_players = new Map(
        previous.players.map((p) => {
            return [p.id, p];
        })
    );

    return next.players.map((next_p) => {
        const previous_p = previous_players.get(next_p.id);

        if (!previous_p) {
            return next_p;
        }

        return {
            ...next_p,
            pos: {
                x: lerp(previous_p.pos.x, next_p.pos.x, alpha),
                y: lerp(previous_p.pos.y, next_p.pos.y, alpha),
                z: lerp(previous_p.pos.z, next_p.pos.z, alpha)
            },
            rot: {
                x: lerp(previous_p.rot.x, next_p.rot.x, alpha),
                y: lerp(previous_p.rot.y, next_p.rot.y, alpha),
                z: lerp(previous_p.rot.z, next_p.rot.z, alpha),
            }
        };
    });
}