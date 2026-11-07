import { Chunk, get_chunk_key } from "./chunk.js";
import { send_text_frame } from "./connection/socket.js";


export class Game {
    /**
     * @type {Map<string, { id: string, hp: number, block: number, team: string, pos: { x: number, y: number, z: number }, rot: { x: number, y: number, z: number}}>} 
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
                const c = new Chunk();
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
            pos: { x: 0, y: 0, z: 0 },
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
            console.log("cannot get id by socket");
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
        for (const id of Game.players.keys()) {
            const input = Game.player_inputs.get(id);
            const player = Game.players.get(id);
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
            Game.player_inputs.set(id, message.inputs);
        } else if (message.type === "rot") {
            //
        } else {
            console.log(`invalid message: unknown message type ${message.type}`);
            console.log(`message: ${message}`);
            return;
        }
    }
}
