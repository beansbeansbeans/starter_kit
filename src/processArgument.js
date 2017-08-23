import randomModule from './helpers/random'
const random = randomModule.random(42)

let toSearch = [], directory = {}

function walk() {
  let newToSearch = []

  for(let i=0; i<toSearch.length; i++) {
    let node = toSearch[i]
    node._id = uuid.v4()

    if(typeof node.children === 'undefined') node.children = []

    node.moralMatrices = []
    if(random.nextDouble() < 0.5) node.moralMatrices.push('A')
    if(random.nextDouble() < 0.5) node.moralMatrices.push('B')
    if(!node.moralMatrices.length) {
      node.moralMatrices = ['A', 'B']
    }

    directory[node._id] = node

    node.children.forEach(d => {
      d.parent = node
      newToSearch.push(d)
    })
  }

  toSearch = newToSearch

  if(toSearch.length) walk()
}

const processArgument = (arg, add) => {
  toSearch.push(arg[0])

  walk()

  for(let i=0; i<add; i++) {
    let keys = Object.keys(directory)

    let randomID = keys[Math.floor(random.nextDouble() * keys.length)]
    let randomParent = directory[randomID]

    let child = {
      "data": random.nextDouble().toFixed(5),
      "supports": random.nextDouble() < 0.5 ? true : false,
      "_id": uuid.v4(),
      moralMatrices: [],
      children: [],
      parent: randomParent
    }

    if(random.nextDouble() < 0.5) child.moralMatrices.push('A')
    if(random.nextDouble() < 0.5) child.moralMatrices.push('B')
    if(!child.moralMatrices.length) {
      child.moralMatrices = ['A', 'B']
    }

    if(typeof randomParent.children === 'undefined') {
      randomParent.children = []
    }

    randomParent.children.push(child)

    directory[child._id] = child
  }
}

export default processArgument