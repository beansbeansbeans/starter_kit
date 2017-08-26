import randomModule from '../helpers/random'
const random = randomModule.random(42)
import schemeGenerators from './scheme'
import schemeData from './config'

let root,
  directory = {},
  schemes = Object.keys(schemeGenerators)

function randomScheme() { 
  return schemes[Math.floor(random.nextDouble() * schemes.length)] 
}

const find = (id) => directory[id]

const create = num => {
  root = schemeGenerators[randomScheme()]({ id: uuid.v4() })

  directory[root.id] = root

  for(let i=0; i<num; i++) {
    let keys = Object.keys(directory),
      randomID = keys[Math.floor(random.nextDouble() * keys.length)],
      randomParent = directory[randomID],
      randomSchemeType = randomScheme(),

      child = schemeGenerators[randomSchemeType]({ id: uuid.v4() })

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