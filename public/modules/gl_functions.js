/**
 * @param {WebGLRenderingContext} gl
 * @param {string} source
 * @param {"vertex" | "fragment"} type
 * @returns {WebGLShader | null}
 */
export function create_shader(gl, source, type) {
    /** @type {WebGLShader | null} */
    let shader = null;

    if (type === "vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else if (type === "fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else {
        console.log(new Error("cannot create shader. type: " + type));
        return null;
    }

    if (shader === null) {
        console.log(new Error("cannot create shader. type: " + type));
        return null;
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        return shader;
    } else {
        console.log(new Error(gl.getShaderInfoLog(shader)));
        return null;
    }
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {WebGLShader} vs
 * @param {WebGLShader} fs
 * @returns {WebGLProgram | null}
 */
export function create_program(gl, vs, fs) {
    /** @type {WebGLProgram | null} */
    const program = gl.createProgram();
    if (program === null) {
        console.log(new Error("cannot create program."));
        return null;
    }

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);

    gl.linkProgram(program);

    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
        return program;
    } else {
        console.log(new Error(gl.getProgramInfoLog(program)));
        return null;
    }
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {Array<number> | Float32Array} data
 * @returns {WebGLBuffer | null}
 */
export function create_vbo(gl, data) {
    /** @type {WebGLBuffer | null} */
    const vbo = gl.createBuffer();
    if (vbo === null) {
        console.log(new Error("cannot create buffer."));
        return null;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return vbo;
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {Array<number> | Uint16Array} data 
 * @returns {WebGLBuffer | null}
 */
export function create_ibo(gl, data) {
    /** @type {WebGLBuffer | null} */
    const ibo = gl.createBuffer();
    if (ibo === null) {
        return null;
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(data),
        gl.STATIC_DRAW
    );
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return ibo;
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {string} source
 * @returns {Promise<WebGLTexture | null>}
 */
export function create_texture(gl, source) {
    return new Promise((resolve) => {
        const img = new Image();

        img.onload = () => {
            const tex = gl.createTexture();
            if (tex === null) {
                console.log(new Error("cannot create texture."));
                resolve(null);
                return;
            }

            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                img
            );
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.bindTexture(gl.TEXTURE_2D, null);

            resolve(tex);
        };

        img.onerror = () => {
            console.log(new Error(`cannot load texture: ${source}`));
            resolve(null);
        };

        img.src = source;
    });
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {Record<string, WebGLBuffer>} vbos
 * @param {Record<string, number>} att_location
 * @param {Record<string, number>} att_stride
 * @returns {void}
 */
export function set_attribute(gl, vbos, att_location, att_stride) {
    for (const key of Object.keys(vbos)) {
        gl.bindBuffer(gl.ARRAY_BUFFER, vbos[key]);
        gl.enableVertexAttribArray(att_location[key]);
        gl.vertexAttribPointer(att_location[key], att_stride[key], gl.FLOAT, false, 0, 0);
    }
}
