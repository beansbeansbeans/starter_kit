let ctx, rafID, width, height, rects = [], tree, argWidth

const render = () => {
  ctx.clearRect(0, 0, width, height)  

  ctx.fillStyle = "black"
  ctx.fillRect(0, 0, width, height)

  ctx.strokeStyle = "white"

  tree.traverseDF(n => {
    let left = n.depth * argWidth
    ctx.strokeRect(left, n.top, argWidth, n.height)
  })
}

export default {
  initialize({ canvas }) {
    ctx = canvas.getContext("2d")

    width = canvas.getAttribute("width")
    height = canvas.getAttribute("height")
  },

  draw(web) {
    tree = web

    tree.reconcile(width, height)

    argWidth = Math.floor(width / tree.getDepth())

    render()
  }
}