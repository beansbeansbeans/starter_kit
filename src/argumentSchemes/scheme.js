import helpers from '../helpers/helpers'
const { pipe, withConstructor } = helpers
import schemes from './config'

const schemeGenerators = {}

const canDisplay = o => {
  return {
    ...o,
    
    get variables() {
      return []
    },

    display() {
      return o.conclusion.replace(/{{([^}]+)}}/g, 
        (_, match) => o.variables[match])
    }
  }
}

for(scheme in schemes) {
  let obj = schemes[scheme]

  schemeGenerators[scheme] = config => pipe(
    canDisplay,
    withConstructor(schemeGenerators[scheme]))
  (Object.assign(obj, config, {}))
}

const anExpertOpinion = schemeGenerators.expertOpinion({
  variables: {
    'E': 'Doug',
    'S': 'pool',
    'A': 'pool is the best sport',
    'B': 'true'
  }
})

console.log(anExpertOpinion.display())

export default schemeGenerators