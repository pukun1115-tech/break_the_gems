/**
 * @description 度数からラジアンに変換
 * @param {number} d
 * @returns {number}
 */
export function deg2rad(d) {
    return d * (Math.PI / 180);
}

/**
 * @description 3次元ベクトルをx軸, y軸, z軸の順に反時計回りに回転
 * @param {{
 *     x: number,
 *     y:number,
 *     z:number
 * }} vector
 * @param {{
 *     x:number,
 *     y:number,
 *     z:number
 * }} rotation
 * @returns {{
 *     x:number,
 *     y:number,
 *     z:number
 * }}
 */
export function rotate_vector_XYZ(vector, rotation) {
    const { x: rx, y: ry, z: rz } = rotation;

    const cosx = Math.cos(rx);
    const sinx = Math.sin(rx);
    const cosy = Math.cos(ry);
    const siny = Math.sin(ry);
    const cosz = Math.cos(rz);
    const sinz = Math.sin(rz);

    //x
    const x1 = vector.x;
    const y1 = vector.y * cosx - vector.z * sinx;
    const z1 = vector.y * sinx + vector.z * cosx;

    //y
    const x2 = z1 * siny + x1 * cosy;
    const y2 = y1;
    const z2 = z1 * cosy - x1 * siny;

    //z
    return {
        x: x2 * cosz - y2 * sinz,
        y: x2 * sinz + y2 * cosz,
        z: z2,
    };
}

/**
 * @description 3次元ベクトルをz軸, y軸, x軸の順に反時計回りに回転
 * @param {{
 *     x: number,
 *     y:number,
 *     z:number
 * }} vector
 * @param {{
 *     x:number,
 *     y:number,
 *     z:number
 * }} rotation
 * @returns {{
 *     x:number,
 *     y:number,
 *     z:number
 * }}
 */
export function rotateVectorZYX(vector, rotation) {
    const { x: rx, y: ry, z: rz } = rotation;

    const cosx = Math.cos(rx);
    const sinx = Math.sin(rx);
    const cosy = Math.cos(ry);
    const siny = Math.sin(ry);
    const cosz = Math.cos(rz);
    const sinz = Math.sin(rz);

    //z
    const x1 = vector.x * cosz - vector.y * sinz;
    const y1 = vector.x * sinz + vector.y * cosz;
    const z1 = vector.z;

    //y
    const x2 = z1 * siny + x1 * cosy;
    const y2 = y1;
    const z2 = z1 * cosy - x1 * siny;

    //x
    return {
        x: x2,
        y: y2 * cosx - z2 * sinx,
        z: y2 * sinx + z2 * cosx,
    };
}
