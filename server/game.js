import { Chunk, get_chunk_key, create_initial_chunks } from "./chunk.js";
import { send_text_frame } from "./connection/socket.js";
import {
    SERVER_FPS,
    GRAVITY,
    PLAYER_MOVE_SPEED,
    PLAYER_JUMP_HEIGHT,
    BREAK_COOLDOWN,
    PLACE_COOLDOWN,
    ATTACK_COOLDOWN,
    CHUNK_SIZE_X,
    CHUNK_SIZE_Y,
    CHUNK_SIZE_Z,
    BREAK_GEM_COOLDOWN
} from "./config.js";
import { check_player_chunk_collision, is_on_ground } from "./collision.js";
import { deg2rad } from "./rotation.js";
import { find_target, break_block, place_block } from "./break_place_block.js";

/** @import { ID, Player, PlayerInput, PlayerState } from "./types.js" */

export class Game {
    static time = 0;
    /** @type {Map<ID, Player} */
    static players = new Map();

    /** @type {Map<ID, PlayerInput>} */
    static player_inputs = new Map();

    /** @type {Map<ID, PlayerState>} */
    static players_states = new Map();

    static sockets_by_id = new Map();
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

    static init_chunks() {
        Game.chunks = create_initial_chunks();
    }

    /**
     * @param {number} length
     * @returns {ID}
     */
    static create_player_id(length) {
        const t = Math.random().toString(36).substring(2, 2 + length);
        return t.charAt(0).toUpperCase() + t.slice(1);
    }

    static add_player(socket) {
        const id = Game.create_player_id(6);
        const count = Game.player_count;
        const team = (count.red === count.blue ? (Math.random() > 0.5 ? "red" : "blue") : (count.red > count.blue ? "blue" : "red"));

        Game.players_states.set(id, {
            break_time: Game.time - BREAK_COOLDOWN,
            break_gem_time: Game.time - BREAK_GEM_COOLDOWN,
            place_time: Game.time - PLACE_COOLDOWN,
            attack_time: Game.time - ATTACK_COOLDOWN,
            velocity_y: 0,
        });

        Game.players.set(id, {
            id: id,
            hp: 100,
            team: team,
            crouch: false,
            pos: (team === "red" ? { x: 1.5, y: 16, z: 1.5 } : { x: 30.5, y: 16, z: 30.5 }),
            rot: (team === "red" ? { x: 0, y: 45, z: 0 } : { x: 0, y: -135, z: 0 }),
            animation: { walking: false, hit: false }
        });

        Game.player_count[team]++;
        Game.sockets_by_id.set(id, socket);
        Game.ids_by_socket.set(socket, id);
        Game.player_inputs.set(id, {
            key_inputs: {},
            mouse_inputs: {
                left_click: false,
                right_click: false
            }
        });

        send_text_frame(socket, JSON.stringify({
            type: "init",
            id: id,
            players: Array.from(Game.players.values()),
            team_point: Game.team_point,
            chunks: Object.fromEntries(
                Array.from(Game.chunks, ([key, c]) => {
                    return [key, c.map];
                })
            )
        }));

        Game.broadcast(JSON.stringify({ type: "player_joined", id: id }));
    }

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

    static update_player_pos_xz(player, input, state) {
        const cosy = Math.cos(deg2rad(player.rot.y));
        const siny = Math.sin(deg2rad(player.rot.y));

        let next_x = player.pos.x;
        let next_z = player.pos.z;

        if (input.key_inputs["KeyW"] === true) {
            next_x += PLAYER_MOVE_SPEED * delta_time * siny;
            next_z += PLAYER_MOVE_SPEED * delta_time * cosy;
        }
        if (input.key_inputs["KeyS"] === true) {
            next_x += -PLAYER_MOVE_SPEED * delta_time * siny;
            next_z += -PLAYER_MOVE_SPEED * delta_time * cosy;
        }
        if (input.key_inputs["KeyA"] === true) {
            next_x += PLAYER_MOVE_SPEED * delta_time * cosy;
            next_z += -PLAYER_MOVE_SPEED * delta_time * siny;
        }
        if (input.key_inputs["KeyD"] === true) {
            next_x += -PLAYER_MOVE_SPEED * delta_time * cosy;
            next_z += PLAYER_MOVE_SPEED * delta_time * siny;
        }
        
        if (!check_player_chunk_collision(Game.chunks, next_x, player.pos.y, player.pos.z, player.crouch)) {
            player.pos.x = next_x;
        }
        if (!check_player_chunk_collision(Game.chunks, player.pos.x, player.pos.y, next_z, player.crouch)) {
            player.pos.z = next_z;
        }
    }

    static update_player_pos_y() {
        //
    }

    static update_player_animation() {
        //
    }

    static update_player_mouse_click_left() {
        //
    }

    static update_player_mouse_click_right() {
        //
    }

    static update() {
        const delta_time = 1 / SERVER_FPS;
        Game.time++;
        for (const id of Game.players.keys()) {
            const input = Game.player_inputs.get(id);
            const player = Game.players.get(id);
            const state = Game.players_states.get(id);
            if (input === undefined || player === undefined || state === undefined) {
                continue;
            }

            //WASD
            Game.update_player_pos_xz(player, input, state);

            //velocity_y
            let next_y = player.pos.y;
            if (player.crouch && input.key_inputs["KeyC"] !== true) {
                if (!check_player_chunk_collision(Game.chunks, player.pos.x, player.pos.y, player.pos.z, false)) {
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

            next_y = player.pos.y + state.velocity_y * delta_time;

            if (check_player_chunk_collision(Game.chunks, player.pos.x, next_y, player.pos.z, player.crouch)) {
                if (state.velocity_y < 0) {
                    while (check_player_chunk_collision(Game.chunks, player.pos.x, next_y, player.pos.z, player.crouch)) {
                        next_y += 0.005;
                    }
                } else {
                    while (check_player_chunk_collision(Game.chunks, player.pos.x, next_y, player.pos.z, player.crouch)) {
                        next_y -= 0.005;
                    }
                }

                state.velocity_y = 0;
            }

            player.pos.y = next_y;

            //小数第2位まで
            player.pos.x = Math.floor(player.pos.x * 100) / 100;
            player.pos.y = Math.floor(player.pos.y * 100) / 100;
            player.pos.z = Math.floor(player.pos.z * 100) / 100;

            //animation
            player.animation.walking = (
                input.key_inputs["KeyW"] === true ||
                input.key_inputs["KeyA"] === true ||
                input.key_inputs["KeyS"] === true ||
                input.key_inputs["KeyD"] === true
            );

            player.animation.hit = input.mouse_inputs.left_click;

            //break and place block
            if (input.mouse_inputs.left_click) {
                const can_break = (state.break_time + BREAK_COOLDOWN <= Game.time);
                const can_break_gem = (state.break_gem_time + BREAK_GEM_COOLDOWN <= Game.time);
                const can_attack = (state.attack_time + ATTACK_COOLDOWN <= Game.time);

                const target = find_target(Game.chunks, player, Game.players);
                if (target !== null) {
                    if (target.type === "hit" && can_attack) {
                        state.attack_time = Game.time;

                        Game.add_player_hp(target.id, -1);
                        send_text_frame(Game.sockets_by_id.get(player.id), JSON.stringify({ type: "attack" }));
                    } else if (target.type === "break_block") {
                        if (target.block_type !== 3 && target.block_type !== 5 && can_break) {
                            const result = break_block(target.chunk_key, target.pos, Game.chunks);
                            if (result !== null) {
                                state.break_time = Game.time;

                                Game.broadcast(JSON.stringify({
                                    type: "update_map",
                                    chunk_key: result.chunk_key,
                                    pos: result.pos,
                                    block: result.block
                                }));
                            }
                        } else if (can_break_gem && ((player.team === "red" && target.block_type === 5) || (player.team === "blue" && target.block_type === 3))) {
                            const result = break_block(target.chunk_key, target.pos, Game.chunks);
                            if (result !== null) {
                                state.break_gem_time = Game.time;

                                if (player.team === "red") {
                                    Game.team_point.blue--;
                                } else {
                                    Game.team_point.red--;
                                }

                                Game.broadcast(JSON.stringify({
                                    type: "update_map",
                                    chunk_key: result.chunk_key,
                                    pos: result.pos,
                                    block: result.block
                                }));
                            }
                        }
                    }
                }
            }

            if (input.mouse_inputs.right_click) {
                if (state.place_time + PLACE_COOLDOWN <= Game.time) {
                    state.place_time = Game.time;
                    const result = place_block(Game.chunks, Game.players, player, (player.team === "red" ? 2 : 4));
                    if (result !== null) {
                        Game.broadcast(JSON.stringify({ type: "update_map", chunk_key: result.chunk_key, pos: result.pos, block: result.block }));
                    }
                }
            }

        }
        Game.broadcast(JSON.stringify({ type: "update_players", players: Array.from(Game.players.values()) }));
    }

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

    static broadcast(text) {
        for (const s of Game.sockets_by_id.values()) {
            send_text_frame(s, text);
        }
    }
}
