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

const reconcile = () => {
  let leaves = tree.countLeaves(),
    depth = tree.getDepth(),
    minHeight = height / leaves

  argWidth = Math.floor(width / depth)

  tree.traverseDF(n => {
    let top = 0

    if(n.depth > 0) {
      let children = n.parent.children

      for(let i=0; i<children.length; i++) {
        if(children[i]._id === n._id) {
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
}

export default {
  initialize({ canvas }) {
    ctx = canvas.getContext("2d")

    width = canvas.getAttribute("width")
    height = canvas.getAttribute("height")
  },

  draw(web) {
    tree = web

    reconcile()
    render()
  }
}