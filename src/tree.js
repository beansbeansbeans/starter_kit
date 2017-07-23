function Node(val) {
  this.data = val
  this.children = []
  this._id = uuid.v4()
}

function Tree(val) {
  this._root = new Node(val, null)
}

Tree.prototype.traverseDB = function() {

}

Tree.prototype.traverseBF = function() {

}

Tree.prototype.contains = function(data, traversal) {

}

Tree.prototype.add = function(n, parent) {
  parent.children.push(n)
  n.parent = parent
}

Tree.prototype.remove = function(node) {

}

const web = new Tree('climate change is a hoax')
const supportNode = new Node('that is right')

web.add(new Node('no it is not'), web._root)
web.add(supportNode, web._root)

console.log(web)