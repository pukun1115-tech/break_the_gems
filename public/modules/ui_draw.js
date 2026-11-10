export const ui_canvas = document.getElementById("ui_canvas");
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

export function ui_draw(hp) {
    ctx.clearRect(0, 0, ui_canvas.width, ui_canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "20px sans-serif";
    ctx.fillText(`HP: ${hp}`, 10, 30);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ui_canvas.width / 2 - 10, ui_canvas.height / 2);
    ctx.lineTo(ui_canvas.width / 2 + 10, ui_canvas.height / 2);
    ctx.moveTo(ui_canvas.width / 2, ui_canvas.height / 2 - 10);
    ctx.lineTo(ui_canvas.width / 2, ui_canvas.height / 2 + 10);
    ctx.stroke();
}