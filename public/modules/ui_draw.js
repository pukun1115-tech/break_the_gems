export const ui_canvas = document.getElementById("ui_canvas");
/** @type {CanvasRenderingContext2D} */
const ctx = ui_canvas.getContext("2d");

function resize_ui_canvas() {
    ui_canvas.width = window.innerWidth;
    ui_canvas.height = window.innerHeight;
}
window.addEventListener("resize", () => {
    setTimeout(() => {
        resize_ui_canvas();
    }, 10);
});
resize_ui_canvas();

export function ui_draw(hp, attack, team_point, rem_tm) {
    ctx.clearRect(0, 0, ui_canvas.width, ui_canvas.height);

    draw_hp(hp);

    draw_crosshair();
    if (attack) {
        draw_hit_effect();
    }

    draw_team_point(team_point);
    draw_remaining_time(rem_tm)
}

function draw_hp(hp) {
    ctx.fillStyle = "rgba(191, 191, 191, 0.75)";
    //左下24, 24
    //横60
    //縦36
    ctx.fillRect(24, ui_canvas.height - 60, 60, 36);

    ctx.fillStyle = "rgba(255, 255, 255, 1)";
    ctx.font = "bold 24px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(hp, 54, ui_canvas.height - 42);

    const width = 240 * (hp / 100);
    if (hp >= 60) {
        ctx.fillStyle = "rgba(0, 255, 0, 0.75)";
    } else if (hp >= 20) {
        ctx.fillStyle = "rgba(255, 255, 0, 0.75)";
    } else {
        ctx.fillStyle = "rgba(255, 0, 0, 0.75)";
    }
    ctx.fillRect(96, ui_canvas.height - 60, width, 36);
}

function draw_crosshair() {
    ctx.strokeStyle = "rgba(191, 191, 191, 1)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ui_canvas.width / 2 - 10, ui_canvas.height / 2);
    ctx.lineTo(ui_canvas.width / 2 + 10, ui_canvas.height / 2);
    ctx.moveTo(ui_canvas.width / 2, ui_canvas.height / 2 - 10);
    ctx.lineTo(ui_canvas.width / 2, ui_canvas.height / 2 + 10);
    ctx.stroke();
}

function draw_hit_effect() {
    ctx.strokeStyle = "rgba(255, 0, 0, 1)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ui_canvas.width / 2 - 5, ui_canvas.height / 2 + 5);
    ctx.lineTo(ui_canvas.width / 2 + 5, ui_canvas.height / 2 - 5);
    ctx.moveTo(ui_canvas.width / 2 - 5, ui_canvas.height / 2 - 5);
    ctx.lineTo(ui_canvas.width / 2 + 5, ui_canvas.height / 2 + 5);
    ctx.stroke();
}

function draw_team_point(teamPoint) {
    const centerX = ui_canvas.width / 2;
    ctx.font = "24px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "rgba(255, 0, 0, 0.75)";
    ctx.fillRect(centerX - 56, 12, 48, 24);
    ctx.fillStyle = "rgba(0, 0, 255, 0.75)";
    ctx.fillRect(centerX + 8, 12, 48, 24);

    ctx.fillStyle = "rgba(255, 255, 255, 1)";
    ctx.fillText(teamPoint.red, centerX - 32, 24);
    ctx.fillText(teamPoint.blue, centerX + 32, 24);
}

function draw_remaining_time(time) {
    ctx.fillStyle = "rgba(191, 191, 191, 0.75)";
    ctx.fillRect(24, 24, 120, 40);

    ctx.fillStyle = "rgba(0, 0, 0, 1)";
    ctx.font = "bold 24px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(Math.floor(time / 60) + ((time % 60) < 10 ? ":0" + (time % 60) : ":" + (time % 60)), 84, 44);
}