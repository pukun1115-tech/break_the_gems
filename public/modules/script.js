import { WEBSOCKET_PROTOCOL } from "./config.js";
import { Chunk, get_chunk_key } from "./chunk.js";
import { player_update, get_player } from "./player.js";
import { draw, canvas } from "./draw.js";

const socket = new WebSocket(`${WEBSOCKET_PROTOCOL}//${window.location.host}`);

//socket.addEventListener();

const key_inputs = {};

const mouse_inputs = {
    movement_x: 0,
    movement_y: 0,
    left_click: false,
    right_click: false
};

/** @type {Map<string, Chunk>} */
let chunks = new Map();

function main_loop(current_time, last_time) {
    //delta_time 1フレーム何秒か
    const delta_time = (current_time - last_time) / 1000;
    //操作
    player_update(chunks, mouse_inputs, key_inputs, delta_time);
    mouse_inputs.movement_x = 0;
    mouse_inputs.movement_y = 0;
    const player = get_player();
    //gldraw
    draw(player, chunks);

    window.requestAnimationFrame((next) => { main_loop(next, current_time); });
}

function init() {
    canvas.addEventListener("contextmenu", (event) => {
        event.preventDefault();
    });

    window.addEventListener("keydown", (event) => {
        key_inputs[event.code] = true;
    });
    window.addEventListener("keyup", (event) => {
        key_inputs[event.code] = false;
    });

    document.addEventListener("pointerlockchange", () => {
        if (document.pointerLockElement !== canvas) {
            for (const key of Object.keys(key_inputs)) {
                key_inputs[key] = false;
            }
            mouse_inputs.left_click = false;
            mouse_inputs.right_click = false;
        }
    });
    canvas.addEventListener("click", () => {
        canvas.requestPointerLock();
    });
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            document.exitPointerLock();
        }
    });
    document.addEventListener("blur", () => {
        document.exitPointerLock();
    });

    canvas.addEventListener("mousedown", (event) => {
        if (document.pointerLockElement !== canvas) {
            return;
        }

        if (event.button === 0) {
            mouse_inputs.left_click = true;
        }
        if (event.button === 2) {
            mouse_inputs.right_click = true;
        }
    });

    canvas.addEventListener("mouseup", (event) => {
        if (document.pointerLockElement !== canvas) {
            return;
        }

        if (event.button === 0) {
            mouse_inputs.left_click = false;
        }
        if (event.button === 2) {
            mouse_inputs.right_click = false;
        }
    });


    canvas.addEventListener("mousemove", (event) => {
        if (document.pointerLockElement !== canvas) {
            return;
        }

        mouse_inputs.movement_x += event.movementX;
        mouse_inputs.movement_y += event.movementY;
    });

    for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
            chunks.set(get_chunk_key(i, j), new Chunk(i, j));
        }
    }

    window.requestAnimationFrame((next) => {
        main_loop(next, next);
    });
}

init();
