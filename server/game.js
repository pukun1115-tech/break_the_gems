import { Chunk, get_chunk_key } from "./chunk.js";
import { send_text_frame } from "./connection/socket.js";
import { GRAVITY, PLAYER_MOVE_SPEED, PLAYER_JUMP_HEIGHT } from "./config.js";
import { check_player_chunk_collision, is_on_ground } from "./collision.js";
import { deg2rad } from "./rotation.js";
import { break_block, place_block } from "./break_place_block.js";


export class Game {
    /**
     * @type {Map<string, { id: string, hp: number, block: number, team: string, velocity_y: number, pos: { x: number, y: number, z: number }, rot: { x: number, y: number, z: number}}>} 
     */
    static players = new Map();
    /**
     * @type {Map<string, { key_inputs: Record<string, boolean>, mouse_inputs: { left_click: boolean, right_click: boolean }}>}
     */
    static player_inputs = new Map();
    static sockets_by_id = new Map();
    static ids_by_socket = new Map();
    static player_count = {
        red: 0,
        blue: 0
    };
    static team_point = {
        red: 0,
        blue: 0
    };
    /**
     * @type {Map<string, Chunk>}
     */
    static chunks = new Map();

    static init_chunks() {
        Game.chunks.clear();
        for (let x = 0; x < 2; x++) {
            for (let z = 0; z < 2; z++) {
                const c = new Chunk(x, z);
                c.create_map();
                Game.chunks.set(get_chunk_key(x, z), c);
            }
        }
    }

    static create_player_id(length) {
        const t = Math.random().toString(36).substring(2, 2 + length);
        return t.charAt(0).toUpperCase() + t.slice(1);
    }

    static create_initial_player(id) {
        const c = Game.player_count;
        const t = (c.red === c.blue ? (Math.random() > 0.5 ? "red" : "blue") : (c.red > c.blue ? "blue" : "red"));
        return {
            id: id,
            hp: 100,
            block: 10,
            team: t,
            velocity_y: 0,
            pos: { x: 0, y: 100, z: 0 },
            rot: { x: 0, y: 0, z: 0 }
        };
    }

    static create_initial_player_input() {
        return {
            key_inputs: {},
            mouse_inputs: {
                left_click: false,
                right_click: false
            }
        };
    }

    static add_player(socket) {
        const id = Game.create_player_id(6);
        const new_player = Game.create_initial_player(id);

        Game.player_count[new_player.team]++;
        Game.sockets_by_id.set(id, socket);
        Game.ids_by_socket.set(socket, id);
        Game.players.set(id, new_player);
        Game.player_inputs.set(id, Game.create_initial_player_input());

        send_text_frame(socket, JSON.stringify({
            type: "init",
            id: id,
            players: Array.from(Game.players.values()),
            team_point: Game.team_point,
            chunks: Object.fromEntries(
                Array.from(Game.chunks, ([key, chunk]) => [key, chunk.map])
            )
        }));

        Game.broadcast(JSON.stringify({ type: "player_joined", id: id }));
    }

    static remove_player(socket) {
        const id = Game.ids_by_socket.get(socket);
        if (id === undefined) {
            console.log("cannot get id by socket; at Game.remove_player");
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

        Game.broadcast(JSON.stringify({ type: "player_left", id: id }));
    }

    static broadcast(text) {
        for (const s of Game.sockets_by_id.values()) {
            send_text_frame(s, text);
        }
    }

    static update() {
        const delta_time = 1 / 60;
        for (const id of Game.players.keys()) {
            const input = Game.player_inputs.get(id);
            const player = Game.players.get(id);
            if (!input || !player) {
                continue;
            }

            //WASD
            const cosy = Math.cos(deg2rad(player.rot.y));
            const siny = Math.sin(deg2rad(player.rot.y));

            let next_x = player.pos.x;
            let next_y = player.pos.y;
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

            if (!check_player_chunk_collision(Game.chunks, next_x, player.pos.y, player.pos.z)) {
                player.pos.x = next_x;
            }
            if (!check_player_chunk_collision(Game.chunks, player.pos.x, player.pos.y, next_z)) {
                player.pos.z = next_z;
            }

            //velocity_y
            player.velocity_y -= GRAVITY * delta_time;

            if (is_on_ground(Game.chunks, player.pos.x, player.pos.y, player.pos.z)) {
                player.velocity_y = 0;

                if (input.key_inputs["Space"] === true) {
                    player.velocity_y = Math.sqrt(2 * GRAVITY * PLAYER_JUMP_HEIGHT);
                }
            }

            next_y = player.pos.y + player.velocity_y * delta_time;

            if (check_player_chunk_collision(Game.chunks, player.pos.x, next_y, player.pos.z)) {
                if (player.velocity_y < 0) {
                    while (check_player_chunk_collision(Game.chunks, player.pos.x, next_y, player.pos.z)) {
                        next_y += 0.005;
                    }
                } else {
                    while (check_player_chunk_collision(Game.chunks, player.pos.x, next_y, player.pos.z)) {
                        next_y -= 0.005;
                    }
                }

                player.velocity_y = 0;
            }

            player.pos.y = next_y;

            //break and place block
            if (input.mouse_inputs.left_click) {
                const result = break_block(Game.chunks, player);
                if (result !== null) {
                    Game.broadcast(JSON.stringify({ type: "update_map", chunk_key: result.chunk_key, pos: result.pos, block_type: 0 }));
                }
            }
            if (input.mouse_inputs.right_click) {
                const result = place_block(Game.chunks, Game.players.values(), player, 5);
                if (result !== null) {
                    Game.broadcast(JSON.stringify({ type: "update_map", chunk_key: result.chunk_key, pos: result.pos, block_type: 5 }));
                }
            }
        }
        Game.broadcast(JSON.stringify({ type: "update_players", players: Array.from(Game.players.values()) }));
    }

    static handle_received_text(socket, text) {
        const id = Game.ids_by_socket.get(socket);
        if (id === undefined) {
            console.log("cannot get id by socket");
            return;
        }
        let message = null;
        try {
            message = JSON.parse(text);
        } catch (error) {
            console.log("invalid message: cannot parse");
            return;
        }

        if (message.type === null || message.type === undefined) {
            console.log("invalid message: missing type");
            console.log(`message: ${message}`);
            return;
        }

        if (message.type === "chat") {
            //
        } else if (message.type === "input") {
            Game.player_inputs.set(id, message.input);
        } else if (message.type === "rot") {
            Game.players.get(id).rot = message.rot;
        } else {
            console.log(`invalid message: unknown message type ${message.type}`);
            console.log(`message: ${message}`);
            return;
        }
    }
}
