import helpers from '../helpers/helpers'
const { pipe, withConstructor } = helpers

const schemes = {
  "expertOpinion": {
    "label": "Expert Opinion",
    "premises": [
      "Source {{E}} is an expert in subject domain {{S}} containing proposition {{A}}",
      "{{E}} asserts that proposition {{A}} is {{B}}."
    ],
    "conclusion": "Conclusion: {{A}} is {{B}}"
  }
}

const schemeGenerators = {}

const canDisplay = o => {
  return {
    ...o,
    display() {
      return o.conclusion.replace(/{{([^}]+)}}/g, (_, match) => o.variables[match])
    }
  }
}

for(scheme in schemes) {
  let obj = schemes[scheme]

  schemeGenerators[scheme] = config => pipe(
    canDisplay,
    withConstructor(schemeGenerators[scheme]))
  (Object.assign(obj, config))
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
