import { WEBSOCKET_PROTOCOL } from "./config.js";
import { Chunk, parse_chunk_key } from "./chunk.js";
import { player_update, get_local_player, set_local_player_rot, get_interpolated_players } from "./player.js";
import { gl_draw, gl_canvas } from "./gl_draw.js";
import { ui_draw, ui_canvas } from "./ui_draw.js";

const socket = new WebSocket(`${WEBSOCKET_PROTOCOL}//${window.location.host}`);

let id = null;
let players = new Map();
const snapshots = [];
let team_point = null;
let time = 0;
let attack_time = -3;
/** @type{Map<string, { walking: number, hit: number }>} */
let animation_time = new Map();

/** @type {Map<string, Chunk>} */
let chunks = new Map();

const key_inputs = {};

const mouse_inputs = {
    movement_x: 0,
    movement_y: 0,
    left_click: false,
    right_click: false
};

window.addEventListener("beforeunload", () => {
    socket.close();
});

socket.addEventListener("close", (event) => {
    console.log("disconnected from server");
    console.log(`code: ${event.code}`);
    console.log(`reason: ${event.reason}`);
});

socket.addEventListener("error", (error) => {
    console.log("error:", error);
});

socket.addEventListener("message", (event) => {
    let data = null;
    try {
        data = JSON.parse(event.data);
    } catch (error) {
        console.log(`error: ${error}`);
        console.log(`data: ${event.data}`);
        return;
    }

    if (data.type === null || data.type === undefined) {
        console.log("invalid message: missing type");
        console.log(`message: ${event.data}`);
        return;
    }

    if (data.type === "init") {
        id = data.id;
        for (const p of data.players) {
            animation_time.set(p.id, { walking: false, hit: false });
            players.set(p.id, p);
            if (p.id === id) {
                set_local_player_rot(p);
            }
        }
        team_point = data.team_point;
        for (const chunk_key of Object.keys(data.chunks)) {
            const { x: pos_x, z: pos_z } = parse_chunk_key(chunk_key);
            const c = new Chunk(pos_x, pos_z);
            c.set_map(data.chunks[chunk_key]);
            c.generate_mesh();
            chunks.set(chunk_key, c);
        }
    } else if (data.type === "player_joined") {
        console.log(`${data.id} joined the game`);
        animation_time.set(data.id, { walking: false, hit: false });
    } else if (data.type === "player_left") {
        console.log(`${data.id} left the game`);
        players.delete(data.id);
        animation_time.delete(data.id);
    } else if (data.type === "update_players") {
        players = new Map(data.players.map((p) => {
            return [p.id, p];
        }));

        snapshots.push({
            received_at: performance.now(),
            players: data.players
        });

        while (snapshots.length > 6) {
            snapshots.shift();
        }

        for (const p of data.players) {
            const animation = animation_time.get(p.id);
            if (animation === undefined) {
                animation_time.set(p.id, {
                    walking: (p.animation.walking ? performance.now() : -1),
                    hit: (p.animation.hit ? performance.now() : -1)
                });
                continue;
            }

            if (p.animation.walking) {
                if (animation.walking === -1) {
                    animation.walking = performance.now();
                }
            } else {
                animation.walking = -1;
            }

            if (p.animation.hit) {
                if (animation.hit === -1) {
                    animation.hit = performance.now();
                }
            } else {
                animation.hit = -1;
            }
        }
    } else if (data.type === "update_map") {
        chunks.get(data.chunk_key).map[data.pos.x][data.pos.y][data.pos.z] = data.block;
        chunks.get(data.chunk_key).generate_mesh();
    } else if (data.type === "attack") {
        attack_time = time;
    } else if (data.type === "full") {
        document.body.innerHTML = `
            <h1>ゲームが満員です。あとでやり直してください。</h1>
            <h2>pukun1115-techの他のゲーム</h2>
            <ul>
                <li><a href="https://paint-ball.onrender.com">paint-ball</a></li>
                <li><a href="https://pukun1115-tech.github.io/tower-defense/">tower-defense</a></li>
            </ul>
            <h2>bloxd.ioをやろう!</h2>
            <ul>
                <li><a href="https://bloxd.io">bloxd.io</a></li>
            </ul>
            <p><a href="https://github.com/pukun1115-tech">pukun1115-tech</a></p>
        `;
    }
});

document.addEventListener("contextmenu", (event) => {
    event.preventDefault();
});

window.addEventListener("keydown", (event) => {
    key_inputs[event.code] = true;
});
window.addEventListener("keyup", (event) => {
    key_inputs[event.code] = false;
});

document.addEventListener("pointerlockchange", () => {
    if (document.pointerLockElement !== gl_canvas) {
        for (const key of Object.keys(key_inputs)) {
            key_inputs[key] = false;
        }
        mouse_inputs.left_click = false;
        mouse_inputs.right_click = false;
    }
});
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        document.exitPointerLock();
    }
});
document.addEventListener("blur", () => {
    document.exitPointerLock();
});
gl_canvas.addEventListener("click", () => {
    gl_canvas.requestPointerLock();
});
ui_canvas.addEventListener("click", () => {
    gl_canvas.requestPointerLock();
});

gl_canvas.addEventListener("mousedown", (event) => {
    if (document.pointerLockElement !== gl_canvas) {
        return;
    }

    if (event.button === 0) {
        mouse_inputs.left_click = true;
    }
    if (event.button === 2) {
        mouse_inputs.right_click = true;
    }
});

gl_canvas.addEventListener("mouseup", (event) => {
    if (document.pointerLockElement !== gl_canvas) {
        return;
    }

    if (event.button === 0) {
        mouse_inputs.left_click = false;
    }
    if (event.button === 2) {
        mouse_inputs.right_click = false;
    }
});


gl_canvas.addEventListener("mousemove", (event) => {
    if (document.pointerLockElement !== gl_canvas) {
        return;
    }

    mouse_inputs.movement_x += event.movementX;
    mouse_inputs.movement_y += event.movementY;
});

function send_input() {
    socket.send(JSON.stringify({
        type: "input",
        input: {
            key_inputs: key_inputs,
            mouse_inputs: {
                left_click: mouse_inputs.left_click,
                right_click: mouse_inputs.right_click
            }
        }
    }));
}

function send_rot(player) {
    socket.send(JSON.stringify({
        type: "rot",
        rot: {
            x: Math.floor(player.rot.x * 10) / 10,
            y: Math.floor(player.rot.y * 10) / 10,
            z: Math.floor(player.rot.z * 10) / 10
        }
    }));
}

function main_loop() {
    if (id !== null) {
        time++;
        //game update
        player_update(mouse_inputs, key_inputs);
        mouse_inputs.movement_x = 0;
        mouse_inputs.movement_y = 0;
        //send
        send_input();
        send_rot(get_local_player());
        //draw
        const pos = get_interpolated_players(performance.now(), snapshots, players).find((p) => p.id === id).pos;
        const rot = get_local_player().rot;
        const FOV = get_local_player().FOV;
        gl_draw(pos, rot, FOV, chunks, get_interpolated_players(performance.now(), snapshots, players), id, animation_time);
        ui_draw(players.get(id).hp, (attack_time + 3 > time), team_point);
        //dev
        /*
        console.clear();
        console.log(players.get(id).hp);
        */
    }

    requestAnimationFrame(() => {
        main_loop();
    });
}

main_loop();
