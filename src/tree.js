function Node(val, supports) {
  this.data = val
  this.children = []
  this._id = uuid.v4()
  this.supports = supports
}

function Tree(val) {
  this._root = new Node(val)
}

Tree.prototype.traverseDF = function(matchFn, seed) {
  if(typeof seed === 'undefined') seed = this._root

  const find = node => node.children.reduce((acc, curr) => {
    if(matchFn(curr)) return curr
    return find(curr)
  }, false)

  if(matchFn(seed)) return seed

  return find(seed)
}

Tree.prototype.traverseBF = function(matchFn) {
  let match, toSearch = [this._root]

  function walk() {
    let newToSearch = []

    for(let i=0; i<toSearch.length; i++) {
      let node = toSearch[i]

      if(matchFn(node)) {
        match = node
        break
      }

      node.children.forEach(c => newToSearch.push(c))
    }

    toSearch = newToSearch

    if(!match && toSearch.length) walk()
  }

  walk()

  return match
}

Tree.prototype.find = function(data, property = 'data') {
  return this.traverseDF(node => node[property] === data)
}

Tree.prototype.add = function(n, parent) {
  parent.children.push(n)
  n.parent = parent
}

Tree.prototype.remove = function(node) {
  let children = node.parent.children
  let index = children.map(c => c._id).indexOf(node._id)

  children.splice(index, 1)
}

Tree.prototype.solve = function(node, value) {
  node.value = value

  // propagate downwards
  this.traverseDF(n => {
    if(typeof n.value !== 'undefined') return

    n.value = n.parent.value ? n.supports : !n.supports
  }, node)
}

export default { Tree, Node }



