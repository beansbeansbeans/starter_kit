import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
const { roundDown, bindAll, removeDuplicates, wrapIterator, shuffle, subVectors, dotProduct, vectorLength, manhattanLength, permute, fractional, degreesToRadians } = helpers
import { encodings } from '../config'
import randomModule from '../helpers/random'
const random = randomModule.random(42)
import { scaleLinear } from 'd3-scale'
import { lineRadial } from 'd3-shape'
import { select } from 'd3-selection'

const progressions = ['forwards', 'backwards', 'scrambled']
const radius = 100
const spokeLength = 50

let radiusScale = scaleLinear().domain([-0.1, 0.1]).range([0, spokeLength])
let radialLine = lineRadial()

class Dropdown extends Component {
  render({ options, change }) {
    return (
      <select onChange={e => change(e.target.value)} class="options">
        {options.map(d => {
          return <option 
            value={d.id}
            selected={d.active} class="option">{d.label}</option>
        })}
      </select>
    )
  }
}

class Permutations extends Component {
  constructor(props) {
    super(props)

    let sentences = [
      "i'm going to give it a marginal thumbs up . i liked it just enough .",
      "a deliciously nonsensical comedy about a city coming apart at its seams ."
    ]

    this.setState({
      hoverEncoding: null,
      sets: sentences.map((d, i) => {
        let words = d.split(" ")
        let permutationIndices = [[]]
        
        for(let i=0; i<words.length; i++) permutationIndices[0].push(i)

        for(let i=0; i<words.length; i++) {
          let order = permutationIndices[0].slice(0)
          let randomIndex = Math.floor(random.nextDouble() * words.length)
          if(random.nextDouble() < 0.5) {
            order[randomIndex - 1] = order.splice(randomIndex, 1, order[randomIndex - 1])[0]
          } else {
            order[randomIndex + 1] = order.splice(randomIndex, 1, order[randomIndex + 1])[0]
          }

          permutationIndices.unshift(order)
        }

        return {
          sentence: d,
          label: d,
          active: i === 0,
          id: i,
          permutationIndices
        }
      }),
      dimensions: Object.keys(this.props.data).map((d, i) => {
        return {
          number: d,
          label: d,
          id: d,
          active: i === 0          
        }
      })
    })
  }

  componentWillMount() {
    console.log(encodings)

    bindAll(this, ['changeSentence'])
  }

  changeSentence(id, key) {
    this.setState({
      [key]: this.state[key].map(d => {
        if(d.id == id) {
          d.active = true
        } else {
          d.active = false
        }

        return d
      })
    })
  }

  getProgression(activeSentence, progression) {
    let items = []
    let words = activeSentence.sentence.split(" ")

    if(progression === 'forwards') {
      for(let i=1; i<=words.length; i++) {
        items.push(words.slice(0, i).join(" "))
      }      
    } else if(progression === 'backwards') {
      for(let i=2; i<=words.length; i++) {
        items.push(words.slice(words.length - i).join(" "))
      }
    } else {
      for(let i=0; i<activeSentence.permutationIndices.length; i++) {
        items.push(permute(words.slice(0), activeSentence.permutationIndices[i]).join(" "))
      }
    }

    return <div>{items.map(d => {
      return <div class="item" onMouseEnter={() => {
        let dimensionality = this.state.dimensions.find(d => d.active).number
        let hoverEncoding = []
        for(let i=0; i<dimensionality; i++) {
          hoverEncoding.push(-0.5 + random.nextDouble())
        }

        this.setState({ hoverEncoding })
      }}>{d}</div>
    })}</div>
  }

  componentDidUpdate() {
    let activeSentence = this.state.sets.find(d => d.active)
    let activeDimensionality = this.state.dimensions.find(d => d.active)

    let points = [ this.state.hoverEncoding, encodings[activeSentence.sentence][activeDimensionality.number] ]
    let selectors = ['.hover-encoding path', '.base-encoding path']

    points.forEach((vec, vIdx) => {
      select(document.querySelector(selectors[vIdx])).attr("d", radialLine(vec.map((d, i) => {
        let angle = degreesToRadians(i * 360/activeDimensionality.number)
        return [angle, radius + radiusScale(d)]
      })) + 'z')      
    })
  }

  render({}, { sets, dimensions, hoverEncoding }) {
    let activeSentence = sets.find(d => d.active)
    let activeDimensionality = dimensions.find(d => d.active)

    let hoverCircle

    if(hoverEncoding) {
      hoverCircle = <div style={`width:${radius * 2}px;height:${radius * 2}px; left:${spokeLength}px; top:${spokeLength}px`} class="circle hover-encoding">{[hoverEncoding.map((d, i) => {
        return <div style={`transform: rotate(${-90 + i * 360/activeDimensionality.number}deg)`} class="spoke">
          <div style={`left:${radius + radiusScale(d)}px`} class="node"></div>
        </div>
      }), <svg width={radius * 2} height={radius * 2}>
          <g transform={`translate(${radius}, ${radius})`}><path></path></g>
        </svg>]}
      </div>
    }

    return (
      <div id="permutations">
        <Dropdown change={id => this.changeSentence(id, 'dimensions')} options={dimensions} />
        <Dropdown change={id => this.changeSentence(id, 'sets')} options={sets} />
        <br/>
        <div style={`width:${radius * 2 + spokeLength * 2}px`} class="vector-wrapper">
          <div style={`left:${spokeLength/2}px;top:${spokeLength/2}px;width:${(radius + spokeLength/2) * 2}px;height:${(radius + spokeLength/2) * 2}px`} class="outline"></div>
          {hoverCircle}
          <div style={`width:${radius * 2}px;height:${radius * 2}px; left:${spokeLength}px; top:${spokeLength}px`} class="base-encoding circle">{[encodings[activeSentence.sentence][activeDimensionality.number].map((d, i) => {
            return <div style={`transform: rotate(${-90 + i * 360/activeDimensionality.number}deg)`} class="spoke">
              <div style={`left:${radius + radiusScale(d)}px`} class="node"></div>
            </div>
          }), <svg width={radius * 2} height={radius * 2}>
                <g transform={`translate(${radius}, ${radius})`}><path></path></g>
              </svg>]}</div>
        </div>
        <div class="progressions">{progressions.map(p => {
          let label = <div class="label">{p.toUpperCase()}</div>
          let items = this.getProgression(activeSentence, p)
          return <div class="progression">{[label, items]}</div>
        })}</div>
      </div>
    )
  }
}

export default Permutations