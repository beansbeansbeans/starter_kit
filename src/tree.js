function Node(val) {
  this.data = val
  this.children = []
  this._id = uuid.v4()
}

function Tree(val) {
  this._root = new Node(val)
}

Tree.prototype.traverseDF = function(matchFn) {
  const find = node => node.children.reduce((acc, curr) => {
    if(matchFn(curr)) return curr
    return find(curr)
  }, false)

  if(matchFn(this._root)) return this._root

  return find(this._root)
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

export default { Tree, Node }