import { Chunk, create_initial_chunks } from "./chunk.js";
import { send_text_frame } from "./connection/socket.js";
import {
    SERVER_FPS,
    GRAVITY,

    PLAYER_HIT_X,
    PLAYER_HIT_Z,
    PLAYER_HIT_Y,

    PLAYER_EYE_Y_CROUCH,
    PLAYER_EYE_Y,

    PLAYER_MOVE_SPEED,
    PLAYER_JUMP_HEIGHT,

    BREAK_COOLDOWN,
    PLACE_COOLDOWN,
    ATTACK_COOLDOWN,
    BREAK_GEM_COOLDOWN,
    SUPER_BREAK_COOLDOWN,

    MATCH_TIME,
    MATCH_WAITING_TIME
} from "./config.js";
import { check_player_chunk_collision, is_on_ground } from "./collision.js";
import { deg2rad } from "./rotation.js";
import { find_target, break_block, place_block } from "./break_place_block.js";

/** @import { WebSocket, Vec3, ID, Player, PlayerInput, PlayerState } from "./types.js" */

export class Game {
    static frame = 0;
    static remaining_time = MATCH_TIME;
    static wait_remaining_time = 0;
    static is_match_finished = false;

    /** @type {Map<ID, Player} */
    static players = new Map();

    /** @type {Map<ID, PlayerInput>} */
    static player_inputs = new Map();

    /** @type {Map<ID, PlayerState>} */
    static players_states = new Map();

    /** @type {Map<ID, WebSocket>} */
    static sockets_by_id = new Map();
    /** @type {Map<WebSocket, ID>} */
    static ids_by_socket = new Map();

    static player_count = {
        red: 0,
        blue: 0
    };

    static team_point = {
        red: 8,
        blue: 8
    };

    /** @type {Map<string, Chunk>} */
    static chunks = new Map();

    /** @type {Set<{ pos: Vec3, rot: Vec3 }>} */
    static super_break = new Set();

    static init_chunks() {
        Game.chunks = create_initial_chunks();
    }

    /**
     * @param {number} length
     * @returns {ID}
     */
    static create_player_id(length) {
        const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        while (true) {
            let t = "";
            for (let i = 0; i < length; i++) {
                t += chars.charAt(Math.floor(Math.random() * chars.length));
            }

            const id = t.charAt(0).toUpperCase() + t.slice(1);

            if (!Game.ids_by_socket.has(id)) {
                return id;
            }
        }
    }

    /**
     * @param {ID} id
     */
    static set_initial_player_state(id) {
        Game.players_states.set(id, {
            break_time: Game.frame - BREAK_COOLDOWN,
            break_gem_time: Game.frame - BREAK_GEM_COOLDOWN,
            place_time: Game.frame - PLACE_COOLDOWN,
            attack_time: Game.frame - ATTACK_COOLDOWN,
            velocity_y: 0,
            super_break_time: Game.frame - SUPER_BREAK_COOLDOWN
        });
    }

    /**
     * @param {ID} id
     * @param {"red" | "blue"} team
     */
    static set_initial_player(id, team) {
        Game.players.set(id, {
            id: id,
            hp: 100,
            team: team,
            crouch: false,
            pos: (team === "red" ? { x: 1.5, y: 16, z: 1.5 } : { x: 30.5, y: 16, z: 30.5 }),
            rot: (team === "red" ? { x: 0, y: 45, z: 0 } : { x: 0, y: -135, z: 0 }),
            animation: { walking: false, hit: false }
        });
    }

    /**
     * @param {ID} id
     */
    static set_initial_player_input(id) {
        Game.player_inputs.set(id, {
            key_inputs: {},
            mouse_inputs: {
                left_click: false,
                right_click: false
            }
        });
    }

    /**
     * @param {WebSocket} socket
     * @param {ID} id
     */
    static add_player(socket, id) {
        Game.sockets_by_id.set(id, socket);
        Game.ids_by_socket.set(socket, id);

        const c = Game.player_count;
        const team = (c.red === c.blue ? (Math.random() > 0.5 ? "red" : "blue") : (c.red > c.blue ? "blue" : "red"));
        Game.player_count[team]++;

        Game.set_initial_player(id, team);
        Game.set_initial_player_input(id);
        Game.set_initial_player_state(id);

        send_text_frame(socket, JSON.stringify({
            type: "init",
            id: id,
            rem_tm: Game.remaining_time,
            players: Array.from(Game.players.values()),
            team_point: Game.team_point,
            chunks: Object.fromEntries(
                Array.from(Game.chunks, ([key, c]) => {
                    return [key, c.map];
                })
            )
        }));

        send_text_frame(socket, JSON.stringify({
            type: "set_rot",
            r: Game.players.get(id).rot
        }));

        Game.broadcast(JSON.stringify({ type: "player_joined", id: id }));
    }

    /**
     * @param {WebSocket} socket
     */
    static remove_player(socket) {
        const id = Game.ids_by_socket.get(socket);
        if (id === undefined) {
            return;
        }

        const player = Game.players.get(id);
        if (player === undefined) {
            return;
        }

        Game.player_count[player.team]--;
        Game.sockets_by_id.delete(id);
        Game.ids_by_socket.delete(socket);
        Game.players.delete(id);
        Game.player_inputs.delete(id);
        Game.players_states.delete(id);

        Game.broadcast(JSON.stringify({ type: "player_left", id: id }));
    }

    /**
     * @param {ID} id
     * @param {number} amount
     */
    static add_player_hp(id, amount) {
        const p = Game.players.get(id);
        if (p === undefined) {
            return;
        }
        p.hp += amount;
    }

    /**
     * @param {Player} player
     * @param {PlayerInput} input
     * @param {number} delta_time
     */
    static update_player_pos_xz(player, input, delta_time) {
        const cosy = Math.cos(deg2rad(player.rot.y));
        const siny = Math.sin(deg2rad(player.rot.y));

        const n = 1;
        for (let i = 1; i <= n; i++) {
            let next_x = player.pos.x;
            let next_z = player.pos.z;

            if (input.key_inputs["KeyW"] === true) {
                next_x += PLAYER_MOVE_SPEED * delta_time * siny / n;
                next_z += PLAYER_MOVE_SPEED * delta_time * cosy / n;
            }
            if (input.key_inputs["KeyS"] === true) {
                next_x += -PLAYER_MOVE_SPEED * delta_time * siny / n;
                next_z += -PLAYER_MOVE_SPEED * delta_time * cosy / n;
            }
            if (input.key_inputs["KeyA"] === true) {
                next_x += PLAYER_MOVE_SPEED * delta_time * cosy / n;
                next_z += -PLAYER_MOVE_SPEED * delta_time * siny / n;
            }
            if (input.key_inputs["KeyD"] === true) {
                next_x += -PLAYER_MOVE_SPEED * delta_time * cosy / n;
                next_z += PLAYER_MOVE_SPEED * delta_time * siny / n;
            }

            const collision_x = check_player_chunk_collision(
                Game.chunks,
                next_x,
                player.pos.y,
                player.pos.z,
                player.crouch
            );

            if (collision_x === null) {
                player.pos.x = next_x;
            } else {
                if (next_x > player.pos.x) {
                    player.pos.x = Math.floor((collision_x.min_x - PLAYER_HIT_X / 2) * 100) / 100;
                } else if (next_x < player.pos.x) {
                    player.pos.x = Math.ceil((collision_x.max_x + PLAYER_HIT_X / 2) * 100) / 100;
                }
            }

            const collision_z = check_player_chunk_collision(
                Game.chunks,
                player.pos.x,
                player.pos.y,
                next_z,
                player.crouch
            );

            if (collision_z === null) {
                player.pos.z = next_z;
            } else {
                if (next_z > player.pos.z) {
                    player.pos.z = Math.floor((collision_z.min_z - PLAYER_HIT_Z / 2) * 100) / 100;
                } else if (next_z < player.pos.z) {
                    player.pos.z = Math.ceil((collision_z.max_z + PLAYER_HIT_Z / 2) * 100) / 100;
                }
            }
        }
    }

    /**
     * @param {Player} player
     * @param {PlayerInput} input
     * @param {PlayerState} state
     * @param {number} delta_time
     */
    static update_player_pos_y(player, input, state, delta_time) {
        let next_y = player.pos.y;

        if (player.crouch && input.key_inputs["KeyC"] !== true) {
            if (
                check_player_chunk_collision(
                    Game.chunks,
                    player.pos.x,
                    player.pos.y,
                    player.pos.z,
                    false
                ) === null
            ) {
                player.crouch = false;
            }
        } else {
            player.crouch = (input.key_inputs["KeyC"] === true);
        }

        state.velocity_y -= GRAVITY * delta_time;

        if (is_on_ground(Game.chunks, player.pos.x, player.pos.y, player.pos.z, player.crouch)) {
            state.velocity_y = 0;

            if (input.key_inputs["Space"] === true) {
                state.velocity_y = Math.sqrt(2 * GRAVITY * PLAYER_JUMP_HEIGHT);
            }
        }

        next_y += state.velocity_y * delta_time;

        const collision_y = check_player_chunk_collision(
            Game.chunks,
            player.pos.x,
            next_y,
            player.pos.z,
            player.crouch
        );

        if (collision_y === null) {
            player.pos.y = next_y;
        } else {
            if (next_y > player.pos.y) {
                player.pos.y = Math.floor((collision_y.min_y - PLAYER_HIT_Y) * 100) / 100;
            } else if (next_y < player.pos.y) {
                player.pos.y = Math.ceil(collision_y.max_y * 100) / 100;
            }
            state.velocity_y = 0;
        }
    }

    /**
     * @param {Player} player
     * @param {Record<string, boolean>} input
     */
    static update_player_animation(player, input) {
        player.animation.walking = (
            input.key_inputs["KeyW"] === true ||
            input.key_inputs["KeyA"] === true ||
            input.key_inputs["KeyS"] === true ||
            input.key_inputs["KeyD"] === true
        );

        player.animation.hit = input.mouse_inputs.left_click;
    }

    /**
     * @param {Player} player 
     * @param {PlayerState} state 
     */
    static update_player_mouse_click_left(player, state) {
        const socket = Game.sockets_by_id.get(player.id);

        const can_break = (state.break_time + BREAK_COOLDOWN <= Game.frame);
        const can_break_gem = (state.break_gem_time + BREAK_GEM_COOLDOWN <= Game.frame);
        const can_attack = (state.attack_time + ATTACK_COOLDOWN <= Game.frame);

        const eye = structuredClone({ pos: player.pos, rot: player.rot });
        eye.pos.y += (player.crouch ? PLAYER_EYE_Y_CROUCH : PLAYER_EYE_Y);

        const target = find_target(Game.chunks, eye, player.team, Game.players, 4, 2);
        if (target === null) {
            return;
        }

        if (can_attack && target.type === "hit") {
            state.attack_time = Game.frame;

            Game.add_player_hp(target.id, -20);
            if (
                !send_text_frame(socket, JSON.stringify({ type: "attack" }))
            ) {
                Game.remove_player(socket);
            }
        } else if (target.type === "break_block") {
            if (target.block_type === 0) {
                return;
            }

            if (
                can_break &&
                (target.block_type !== 3 && target.block_type !== 5)
            ) {
                const result = break_block(target.chunk_key, target.pos, Game.chunks, 1);
                if (result !== null) {
                    state.break_time = Game.frame;

                    Game.broadcast(JSON.stringify({
                        type: "update_map",
                        chunk_key: result.chunk_key,
                        pos: result.pos,
                        block: result.block
                    }));
                }
            } else if (
                can_break_gem &&
                (
                    (player.team === "red" && target.block_type === 5) ||
                    (player.team === "blue" && target.block_type === 3)
                )
            ) {
                const result = break_block(target.chunk_key, target.pos, Game.chunks, 1);
                if (result !== null) {
                    state.break_gem_time = Game.frame;

                    Game.broadcast(JSON.stringify({
                        type: "update_map",
                        chunk_key: result.chunk_key,
                        pos: result.pos,
                        block: result.block
                    }));

                    if (result.block.type === 0) {
                        if (player.team === "red") {
                            Game.team_point.blue--;
                        } else {
                            Game.team_point.red--;
                        }

                        Game.broadcast(JSON.stringify({
                            type: "update_tp",
                            tp: Game.team_point
                        }));
                    }
                }
            }
        }
    }

    /**
     * @param {Player} player
     * @param {PlayerState} state
     */
    static update_player_mouse_click_right(player, state) {
        if (state.place_time + PLACE_COOLDOWN <= Game.frame) {
            state.place_time = Game.frame;
            const result = place_block(Game.chunks, Game.players, player, (player.team === "red" ? 2 : 4));
            if (result !== null) {
                Game.broadcast(JSON.stringify({
                    type: "update_map",
                    chunk_key: result.chunk_key,
                    pos: result.pos,
                    block: result.block
                }));
            }
        }
    }

    static update_super_break() {
        for (const s of Game.super_break) {
            const target = find_target(Game.chunks, s, null, null, 128, 0);
            if (target === null || target.type === "hit") {
                continue;
            }

            if (
                (target.block_type === 1 || target.block_type === 3 || target.block_type === 5)
            ) {
                Game.super_break.delete(s);
                continue;
            }

            const result = break_block(target.chunk_key, target.pos, Game.chunks, 8);
            if (result !== null) {
                Game.broadcast(JSON.stringify({
                    type: "update_map",
                    chunk_key: result.chunk_key,
                    pos: result.pos,
                    block: result.block
                }));
            }

        }
    }

    static update() {
        const delta_time = 1 / SERVER_FPS;
        Game.tick();
        for (const id of Game.ids_by_socket.values()) {
            const input = Game.player_inputs.get(id);
            const player = Game.players.get(id);
            const state = Game.players_states.get(id);
            if (input === undefined || player === undefined || state === undefined) {
                continue;
            }

            //WASD
            Game.update_player_pos_xz(player, input, delta_time);

            //velocity_y
            Game.update_player_pos_y(player, input, state, delta_time);

            //animation
            Game.update_player_animation(player, input);

            //mouse input
            if (!Game.is_match_finished) {
                if (input.mouse_inputs.left_click) {
                    Game.update_player_mouse_click_left(player, state);
                }
                if (input.mouse_inputs.right_click) {
                    Game.update_player_mouse_click_right(player, state);
                }
            }

            //KeyQ
            if (input.key_inputs["KeyQ"] === true) {
                if (state.super_break_time + SUPER_BREAK_COOLDOWN <= Game.frame) {
                    state.super_break_time = Game.frame;
                    const t = structuredClone({ pos: player.pos, rot: player.rot });
                    t.pos.y += PLAYER_EYE_Y
                    Game.super_break.add(t);
                }
            }

            Game.update_super_break();
        }

        //match finish?
        if (!Game.is_match_finished) {
            if (Game.team_point.red === 0 || Game.team_point.blue === 0) {
                Game.is_match_finished = true;
                Game.wait_remaining_time = MATCH_WAITING_TIME;

                if (Game.team_point.red === 0 && Game.team_point.blue === 0) {
                    Game.broadcast(JSON.stringify({
                        type: "finish",
                        r: "draw"
                    }));
                } else if (Game.team_point.red === 0) {
                    Game.broadcast(JSON.stringify({
                        type: "finish",
                        r: "blue"
                    }));
                } else {
                    Game.broadcast(JSON.stringify({
                        type: "finish",
                        r: "red"
                    }));
                }
            } else if (Game.remaining_time <= 0) {
                Game.is_match_finished = true;
                Game.wait_remaining_time = MATCH_WAITING_TIME;
                Game.broadcast(JSON.stringify({
                    type: "finish",
                    r: (Game.team_point.red === Game.team_point.blue ? "draw" : (Game.team_point.red > Game.team_point.blue ? "red" : "blue"))
                }));
            } else {
                Game.broadcast(JSON.stringify({
                    type: "update_rem_tm",
                    t: Game.remaining_time
                }));
            }
        } else {
            if (Game.wait_remaining_time <= 0) {
                //start new match

                //reset game data
                Game.player_count = {
                    red: 0,
                    blue: 0
                };

                Game.team_point = {
                    red: 8,
                    blue: 8
                };
                Game.broadcast(JSON.stringify({
                    type: "update_tp",
                    tp: Game.team_point
                }));

                //reset players
                Game.players.clear();
                Game.players_states.clear();
                Game.player_inputs.clear();
                for (const id of Game.ids_by_socket.values()) {
                    const socket = Game.sockets_by_id.get(id);

                    const c = Game.player_count;
                    const team = (c.red === c.blue ? (Math.random() > 0.5 ? "red" : "blue") : (c.red > c.blue ? "blue" : "red"));
                    Game.player_count[team]++;

                    Game.set_initial_player(id, team);
                    Game.set_initial_player_input(id);
                    Game.set_initial_player_state(id);

                    send_text_frame(socket, JSON.stringify({
                        type: "set_rot",
                        r: Game.players.get(id).rot
                    }));
                }
                //update playersはupdate()の最後に

                //reset chunks
                Game.init_chunks();
                Game.broadcast(JSON.stringify({
                    type: "set_chunks",
                    chunks: Object.fromEntries(
                        Array.from(Game.chunks, ([key, c]) => {
                            return [key, c.map];
                        })
                    )
                }));

                //start match
                Game.is_match_finished = false;
                Game.remaining_time = MATCH_TIME;
                Game.broadcast(JSON.stringify({
                    type: "start",
                    t: Game.remaining_time
                }));
            } else {
                Game.broadcast(JSON.stringify({
                    type: "update_rem_tm",
                    t: Game.wait_remaining_time
                }));
            }
        }
        Game.broadcast(JSON.stringify({
            type: "update_players",
            players: Array.from(Game.players.values())
        }));
    }

    static tick() {
        Game.frame++;
        if (Game.frame % SERVER_FPS === 0) {
            if (Game.is_match_finished) {
                if (Game.wait_remaining_time > 0) {
                    Game.wait_remaining_time--;
                }
            } else {
                if (Game.remaining_time > 0) {
                    Game.remaining_time--;
                }
            }
        }
    }

    /**
     * @param {WebSocket} socket
     * @param {string} text
     */
    static handle_received_text(socket, text) {
        const id = Game.ids_by_socket.get(socket);
        if (id === undefined) {
            Game.remove_player(socket);
            socket.destroy();
            return;
        }

        let message = null;
        try {
            message = JSON.parse(text);
        } catch (error) {
            console.log("invalid message: cannot parse");
            console.log("message: ", text);
            Game.remove_player(socket);
            socket.destroy();
            return;
        }

        if (message === null || typeof message !== "object" || Array.isArray(message)) {
            console.log("invalid message: not an object");
            console.log("message: ", message);
            Game.remove_player(socket);
            socket.destroy();
            return;
        }

        if (!Object.hasOwn(message, "type")) {
            console.log("invalid message: missing type");
            console.log("message: ", message);
            Game.remove_player(socket);
            socket.destroy();
            return;
        }

        if (message.type === "input") {
            if (
                !Object.hasOwn(message, "input") ||
                !Object.hasOwn(message.input, "mouse_inputs") ||
                !Object.hasOwn(message.input.mouse_inputs, "left_click") ||
                !Object.hasOwn(message.input.mouse_inputs, "right_click")
            ) {
                console.log("invalid message");
                console.log("message: ", message);
                Game.remove_player(socket);
                socket.destroy();
                return;
            }
            Game.player_inputs.set(id, message.input);
        } else if (message.type === "rot") {
            if (
                !Object.hasOwn(message, "rot") ||
                !Object.hasOwn(message.rot, "x") ||
                !Object.hasOwn(message.rot, "y") ||
                !Object.hasOwn(message.rot, "z")
            ) {
                console.log("invalid message");
                console.log("message: ", message);
                Game.remove_player(socket);
                socket.destroy();
                return;
            }
            Game.players.get(id).rot.x = (Number.isFinite(message.rot.x) ? message.rot.x : 0);
            Game.players.get(id).rot.y = (Number.isFinite(message.rot.y) ? message.rot.y : 0);
            Game.players.get(id).rot.z = (Number.isFinite(message.rot.z) ? message.rot.z : 0);
        } else {
            console.log("invalid message: unknown message type");
            console.log("message: ", message);
            return;
        }
    }

    /**
     * @param {string} text
     */
    static broadcast(text) {
        for (const s of Game.sockets_by_id.values()) {
            if (
                !send_text_frame(s, text)
            ) {
                Game.remove_player(s);
            }
        }
    }
}
