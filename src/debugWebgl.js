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

traverse nodes, add top and height properties to each
- top is inherited from its parent, plus however many of its siblings have already been templated
- height is however many leaf nodes this node contains, times the min-height. 
- if this node is a leaf node, then its height is the minheight.

should we have each node keep track of how many leaf nodes it contains?
*/

export default {
  initialize({ canvas, web }) {
    ctx = canvas.getContext("2d")

    width = canvas.getAttribute("width")
    height = canvas.getAttribute("height")

    let leaves = web.countLeaves(),
      depth = web.getDepth(),
      argWidth = Math.floor(width / depth),
      minHeight = height / leaves

    web.traverseDF(n => {
      let top = 0

      if(n.depth > 0) {
        top = 0

        let children = n.parent.children

        for(let i=0; i<children.length; i++) {
          let child = children[i]

          if(child._id === n._id) {
            if(i > 0) {
              let prevSib = children[i - 1]
              top = prevSib.top + prevSib.height
            } else {
              top = n.parent.top
            }
            break
          }
        }
      }

      n.top = top
      n.height = Math.max(minHeight, n.leaves * minHeight)
    })

    render()
    // rafID = render()
  },

  draw() {

  }
}