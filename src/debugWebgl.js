let ctx, rafID, width, height, rects = []

const render = () => {
  ctx.clearRect(0, 0, width, height)  

  ctx.fillStyle = "black"
  ctx.fillRect(0, 0, width, height)

  ctx.strokeStyle = "white"
  ctx.strokeRect(10, 10, 100, 100)

  // rafID = requestAnimationFrame(render)
}

/* 
keep track: how many columns are there
also: how many occupied and unoccupied rectangles are there in the last column
to determine this: just count the number of leaf nodes in the tree (through DF search)
*/

export default {
  initialize({ canvas, web }) {
    ctx = canvas.getContext("2d")

    width = canvas.getAttribute("width")
    height = canvas.getAttribute("height")

    console.log(web.countLeaves())
    console.log(web.getDepth())

    render()
    // rafID = render()
  },

  draw() {

  }
}