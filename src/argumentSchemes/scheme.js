import helpers from '../helpers/helpers'
const { pipe, withConstructor } = helpers

const schemes = {
  "expertOpinion": {
    "label": "Expert Opinion",
    "data": "Source {{E}} is an expert in subject domain {{S}} containing proposition {{A}}"
  }
}

const canDisplay = data => o => {
  return {
    ...o,
    display() {
      return data.replace(/{{([^}]+)}}/g, (_, o) => this.variables[o])
    }
  }
}

for(scheme in schemes) {
  let obj = schemes[scheme]

  obj.generate = ({ variables }) => pipe(
    canDisplay(obj.data),
    withConstructor(obj.generate))({ variables })
}

const anExpertOpinion = schemes.expertOpinion.generate({
  variables: {
    'E': 'Doug',
    'S': 'pool',
    'A': 'pool is the best sport'
  }
})

console.log(anExpertOpinion.display())
