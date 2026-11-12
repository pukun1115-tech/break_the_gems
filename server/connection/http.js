import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import {
    MIME_TYPES,
    DEFAULT_PATH,
    PUBLIC_FILES,
    MAGIC_STRING,
    ALLOWED_ORIGINS,
    MAX_PLAYERS
} from "../config.js";
import { send_close_frame } from "./socket.js";
import { Game } from "../game.js";


export function create_http_server(request, response) {
    const request_url = (request.url === "/" ? "/index.html" : request.url);
    if (request.method !== "GET" || !PUBLIC_FILES.includes(request_url)) {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("404 Not Found");
        return;
    }
    const extension = path.extname(request_url);
    const file_path = path.join(DEFAULT_PATH, "public", request_url);
    fs.readFile(file_path, (error, data) => {
        if (error !== null) {
            response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
            response.end(`Could Not Read File. file_path: ${file_path}`);
            console.log(`Could Not Read File. file_path: ${file_path}`);
            return;
        }
        response.writeHead(200, { "Content-Type": (MIME_TYPES[extension] ?? "application/octet-stream") });
        response.end(data);
    });
}

export function server_on_upgrade(request, socket) {
    const origin = request.headers["origin"];

    if (typeof origin !== "string" || !ALLOWED_ORIGINS.has(origin)) {
        socket.write(
            "HTTP/1.1 403 Forbidden\r\n" +
            "Connection: close\r\n" +
            "\r\n"
        );
        socket.destroy();
        return false;
    }

    const web_socket_key = request.headers["sec-websocket-key"];
    if (!web_socket_key) {
        socket.destroy();
        return false;
    }
    const accept_key = crypto
        .createHash("sha1")
        .update(web_socket_key + MAGIC_STRING)
        .digest("base64");
    const response = (
        "HTTP/1.1 101 Switching Protocols\r\n" +
        "Upgrade: websocket\r\n" +
        "Connection: upgrade\r\n" +
        `Sec-WebSocket-Accept: ${accept_key}\r\n` +
        "\r\n"
    );
    socket.write(response);
    if (Game.players.size >= MAX_PLAYERS) {
        send_close_frame(socket, 1013, "混んでます");
        socket.end();
        return;
    }
    return true;
}