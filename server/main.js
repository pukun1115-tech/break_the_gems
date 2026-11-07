import http from "node:http";
import { PORT } from "./config.js";
import {
    create_http_server,
    server_on_upgrade
} from "./connection/http.js";
import {
    handle_received_buffer
} from "./connection/socket.js";
import {
    Game
} from "./game.js";


const server = http.createServer((request, response) => {
    create_http_server(request, response);
});

server.on("upgrade", (request, socket, head) => {
    try {
        server_on_upgrade(request, socket);
    } catch (error) {
        console.log(`error: ${error}`);
        return;
    }

    Game.add_player(socket);

    let received_data_buffer = Buffer.alloc(0);
    if (head?.length > 0) {
        received_data_buffer = handle_received_buffer(
            socket,
            Buffer.concat([received_data_buffer, head]),
        );
    }

    socket.on("data", (data) => {
        if (received_data_buffer === null) {
            return;
        }
        received_data_buffer = handle_received_buffer(
            socket,
            Buffer.concat([received_data_buffer, data])
        );
    });

    socket.on("close", () => {
        Game.remove_player(socket);
    });

    socket.on("error", (error) => {
        console.log(`error: ${error}`);
        Game.remove_player(socket);
    });

    socket.on("end", () => {
        Game.remove_player(socket);
    });
});

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`- Local: http://localhost:${PORT}/`);
});

Game.init_chunks();
setInterval(() => {
    Game.update();
}, 1000 / 60);
