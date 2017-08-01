let ctx, rafID, width, height

const render = () => {
  ctx.clearRect(0, 0, width, height)  

  ctx.fillStyle = "white"
  // ctx.fillStyle = `rgb(${Math.round(Math.random() * 255)}, ${Math.round(Math.random() * 255)}, ${Math.round(Math.random() * 255)})`
  ctx.fillRect(0, 0, width, height)

  rafID = requestAnimationFrame(render)
}

export default {
  initialize({ canvas, web }) {
    ctx = canvas.getContext("2d")

    width = canvas.getAttribute("width")
    height = canvas.getAttribute("height")

    rafID = render()
  },

  draw() {

  }
}