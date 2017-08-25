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

    randomParent.attackers.push({
      critical_question_id: 
        Math.floor(random.nextDouble() * schemeData[randomSchemeType].critical_questions.length),
      node: child
    })
  }

  return root
}

export default create