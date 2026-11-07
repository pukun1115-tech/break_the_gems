import {
    TEXT_OPCODE,
    CLOSE_OPCODE,
    PING_OPCODE,
    PONG_OPCODE,
    MAX_BUFFER_SIZE
} from "../config.js";
import { Game } from "../game.js";


export function send_text_frame(socket, text) {
    const payload = Buffer.from(text, "utf8");
    const FIN = 0b10000000;
    let frame = null;
    if (payload.length <= 125) {
        frame = Buffer.alloc(2 + payload.length);
        frame[0] = FIN | TEXT_OPCODE;
        frame[1] = payload.length;
        payload.copy(frame, 2);
    } else if (payload.length <= 65535) {
        frame = Buffer.alloc(4 + payload.length);
        frame[0] = FIN | TEXT_OPCODE;
        frame[1] = 126;
        frame.writeUInt16BE(payload.length, 2);
        payload.copy(frame, 4);
    } else {
        frame = Buffer.alloc(10 + payload.length);
        frame[0] = FIN | TEXT_OPCODE;
        frame[1] = 127;
        frame.writeBigUInt64BE(BigInt(payload.length), 2);
        payload.copy(frame, 10);
    }

    if (socket.writable) {
        socket.write(frame);
        return true;
    }
    return false;
}

export function send_close_frame(socket, status_code = 1000, reason = "") {
    const reason_buffer = Buffer.from(reason, "utf8");
    if (reason_buffer.length > 123) {
        console.log("the close reason must not be more than 123bytes");
        return false;
    }
    const payload = Buffer.alloc(reason_buffer.length + 2);
    const FIN = 0b10000000;
    payload.writeUInt16BE(status_code, 0);
    reason_buffer.copy(payload, 2);
    const frame = Buffer.alloc(payload.length + 2);
    frame[0] = FIN | CLOSE_OPCODE;
    frame[1] = payload.length;
    payload.copy(frame, 2);
    if (socket.writable) {
        socket.write(frame);
        return true;
    }
    return false;
}

export function send_ping_frame(socket, payload = Buffer.alloc(0)) {
    if (payload.length > 125) {
        console.log("the ping payload must not be more than 125bytes");
        return false;
    }
    const FIN = 0b10000000;
    const frame = Buffer.alloc(2 + payload.length);
    frame[0] = FIN | PING_OPCODE;
    frame[1] = payload.length;
    payload.copy(frame, 2);
    if (socket.writable) {
        socket.write(frame);
        return true;
    }
    return false;
}

export function send_pong_frame(socket, payload = Buffer.alloc(0)) {
    if (payload.length > 125) {
        console.log("the pong payload must not be more than 125bytes");
        return false;
    }
    const FIN = 0b10000000;
    const frame = Buffer.alloc(2 + payload.length);
    frame[0] = FIN | PONG_OPCODE;
    frame[1] = payload.length;
    payload.copy(frame, 2);
    if (socket.writable) {
        socket.write(frame);
        return true;
    }
    return false;
}

export function decode_frame_payload(frame) {
    if (frame.length < 2) {
        return null;
    }

    const second_byte = frame[1];
    const is_masked = (second_byte >> 7) === 1;
    const length_code = second_byte & 0b01111111;

    if (!is_masked) {
        return null;
    }

    let payload_length = null;
    let payload_start_index = null;

    if (length_code <= 125) {
        payload_length = length_code;
        payload_start_index = 6;
    } else if (length_code === 126) {
        if (frame.length < 4) {
            return null;
        }
        payload_length = frame.readUInt16BE(2);
        payload_start_index = 8;
    } else {
        if (frame.length < 10) {
            return null;
        }
        payload_length = Number(frame.readBigUInt64BE(2));
        payload_start_index = 14;
    }

    if (frame.length < payload_start_index + payload_length) {
        return null;
    }

    const masking_key_start_index = payload_start_index - 4;
    const masking_key = frame.subarray(
        masking_key_start_index,
        masking_key_start_index + 4
    );

    const masked_payload = frame.subarray(
        payload_start_index,
        payload_start_index + payload_length
    );

    const decoded_payload = Buffer.alloc(payload_length);

    for (let i = 0; i < payload_length; i++) {
        decoded_payload[i] = masked_payload[i] ^ masking_key[i % 4];
    }

    return decoded_payload;
}

export function decode_text_frame(frame) {
    const payload = decode_frame_payload(frame);
    return (payload === null ? null : payload.toString("utf8"));
}

export function extract_frame(buffer) {
    if (buffer.length < 2) {
        return { "frame": null, "rest": buffer };
    }
    const first_byte = buffer[0];
    const second_byte = buffer[1];

    const fin = (first_byte >> 7) === 1;
    const opcode = first_byte & 0b00001111;
    const is_masked = (second_byte >> 7) === 1;
    const length_code = second_byte & 0b01111111;

    const is_text_frame = (opcode === TEXT_OPCODE);
    const is_close_frame = (opcode === CLOSE_OPCODE);
    const is_ping_frame = (opcode === PING_OPCODE);
    const is_pong_frame = (opcode === PONG_OPCODE);

    if (
        !fin ||
        (!is_text_frame && !is_close_frame && !is_ping_frame && !is_pong_frame) ||
        !is_masked
    ) {
        console.log("invalid WebSocket frame");
        return null;
    }

    const is_control_frame = (is_close_frame || is_ping_frame || is_pong_frame);
    if (is_control_frame && length_code > 125) {
        console.log("invalid WebSocket control frame");
        return null;
    }

    let length_bytes;
    if (length_code <= 125) {
        length_bytes = 0;
    } else if (length_code === 126) {
        length_bytes = 2;
    } else {
        length_bytes = 8;
    }
    const header_length = 2 + length_bytes + 4;
    if (buffer.length < header_length) {
        return { "frame": null, "rest": buffer };
    }
    const payload_length = (length_code <= 125 ? length_code : buffer.readUInt16BE(2));
    const frame_length = header_length + payload_length;
    if (buffer.length < frame_length) {
        return { "frame": null, "rest": buffer };
    }

    return {
        "frame": buffer.subarray(0, frame_length),
        "rest": buffer.subarray(frame_length),
    };
}

export function handle_received_buffer(socket, buffer) {
    if (buffer.length > MAX_BUFFER_SIZE) {
        socket.destroy();
        return null;
    }

    while (buffer.length > 0) {
        const result = extract_frame(buffer);
        if (result === null) {
            socket.destroy();
            return null;
        }

        const { frame, rest } = result;
        buffer = rest;
        if (frame === null) {
            return buffer;
        }

        const first_byte = frame[0];
        const opcode = first_byte & 0b00001111;
        if (opcode === CLOSE_OPCODE) {
            send_close_frame(socket, 1000, "normal termination");
            socket.end();
            return null;
        } else if (opcode === PING_OPCODE) {
            const payload = decode_frame_payload(frame);
            if (payload === null) {
                socket.destroy();
                return null;
            }

            send_pong_frame(socket, payload);
        } else if (opcode === PONG_OPCODE) {
            //do nothing
        } else if (opcode === TEXT_OPCODE) {
            const text = decode_text_frame(frame);
            if (text === null) {
                socket.destroy();
                return null;
            }
            //do anything
            Game.handle_received_text(socket, text);
        }
    }

    return buffer;
}