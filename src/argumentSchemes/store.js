import randomModule from '../helpers/random'
const random = randomModule.random(42)
import schemeGenerators from './scheme'
import schemeData from './config'

let root,
  directory = {}, toSearch = []
  schemes = Object.keys(schemeGenerators)

function randomScheme() { 
  return schemes[Math.floor(random.nextDouble() * schemes.length)] 
}

const find = id => directory[id]

function walk() {
  let newToSearch = []

  for(let i=0; i<toSearch.length; i++) {
    let node = toSearch[i], 
      randomSchemeType = randomScheme(),

      child = schemeGenerators[randomSchemeType]({
        id: uuid.v4(),
        description: node.data
      })

    directory[child.id] = child

    if(typeof root === 'undefined') root = child

    if(node.parent) {
      directory[node.parent][node.type].push({ node: child })
    }

    node.attackers.forEach(d => {
      d.parent = child.id
      d.type = 'attackers'
      newToSearch.push(d)
    })

    node.defenders.forEach(d => {
      d.parent = child.id
      d.type = 'defenders'
      newToSearch.push(d)
    })
  }

  toSearch = newToSearch

  if(toSearch.length) walk()
}

const create = (data, num) => {
  toSearch.push(data[0])

  walk()

  for(let i=0; i<num; i++) {
    let keys = Object.keys(directory),
      randomID = keys[Math.floor(random.nextDouble() * keys.length)],
      randomParent = directory[randomID],
      randomSchemeType = randomScheme(),

      child = schemeGenerators[randomSchemeType]({ 
        id: uuid.v4(),
        description: 'lol'
      })

    directory[child.id] = child

    if(random.nextDouble() < 0.75) {
      randomParent.attackers.push({
        critical_question_id: 
          Math.floor(random.nextDouble() * schemeData[randomSchemeType].critical_questions.length),
        node: child
      })      
    } else {
      randomParent.defenders.push({
        node: child
      })
    }
  }

  return {
    root,
    find,
    getRandomAttacker: function(id) {
      let match = find(id)
      if(!match || !match.attackers.length) return false

      let attackers = match.attackers
      return attackers[Math.floor(random.nextDouble() * attackers.length)].node
    },

    getRandomDefender: function(id) {
      let match = find(id)
      if(!match || !match.defenders.length) return false

      let defenders = match.defenders
      return defenders[Math.floor(random.nextDouble() * defenders.length)].node
    }
  }
}

export default create