import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
const { roundDown, bindAll, removeDuplicates, wrapIterator, shuffle, subVectors, dotProduct, vectorLength, manhattanLength, permute, fractional, degreesToRadians, trim } = helpers
import randomModule from '../helpers/random'
const random = randomModule.random(42)
import { scaleLinear } from 'd3-scale'
import { lineRadial } from 'd3-shape'
import { select } from 'd3-selection'

const encodings = [
  "i'm going to give it a marginal thumbs up . i liked it just enough .",
  "a deliciously nonsensical comedy about a city coming apart at its seams .",
 "the story is also as unoriginal as they come , already having been recycled more times than i'd care to count ."
]

const progressions = ['forwards', 'backwards', 'scrambled']
const radius = 100
const spokeLength = 50

let radiusScale = scaleLinear().domain([-0.1, 0.1]).range([0, spokeLength])
let radialLine = lineRadial()
let encodingsDict = {}

const getDistance = {
  'euclidean': vectorLength,
  'manhattan': manhattanLength,
  'fractional': fractional(0.5)
}

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

class Embeddings10D extends Component {
  constructor(props) {
    super(props)

    let distances = ['euclidean', 'manhattan', 'fractional']

    this.setState({
      hoverEncoding: null,
      sets: encodings.map((d, i) => {
        return {
          sentence: d,
          label: d,
          active: i === 0,
          id: i
        }
      }),
      dimensions: Object.keys(this.props.data).map((d, i) => {
        return {
          number: d,
          label: d,
          id: d,
          active: i === 0          
        }
      }),
      distances: distances.map((d, i) => {
        return {
          label: d,
          id: d,
          active: i === 0
        }
      })
    })
  }

  componentWillMount() {
    console.log(encodings)

    let dimensions = Object.keys(this.props.data)

    encodings.forEach(sen => {
      encodingsDict[sen] = {}

      dimensions.forEach(d => {
        encodingsDict[sen][d] = this.props.data[d].find(obj => obj.sentence == sen).encoding
      })
    })

    bindAll(this, ['changeSentence', 'draw'])
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

  draw() {
    let activeSentence = this.state.sets.find(d => d.active)
    let activeDimensionality = this.state.dimensions.find(d => d.active)

    let points = [ encodingsDict[trim(activeSentence.sentence)][activeDimensionality.number] ]
    let selectors = ['.base-encoding path']

    points.forEach((vec, vIdx) => {
      select(document.querySelector(selectors[vIdx])).attr("d", radialLine(vec.map((d, i) => {
        let angle = degreesToRadians(i * 360/activeDimensionality.number)
        return [angle, radius + radiusScale(d)]
      })) + 'z')      
    })    
  }

  componentDidMount() {
    this.draw()
  }

  componentDidUpdate() {
    this.draw()
  }

  render({}, { sets, dimensions, hoverEncoding, distances }) {
    let activeSentence = sets.find(d => d.active)
    let activeDimensionality = dimensions.find(d => d.active)

    return (
      <div id="embeddings_10d">
        <Dropdown change={id => this.changeSentence(id, 'dimensions')} options={dimensions} />
        <br/>
        <div style={`width:${radius * 2 + spokeLength * 2}px`} class="vector-wrapper">
          <div style={`left:${spokeLength/2}px;top:${spokeLength/2}px;width:${(radius + spokeLength/2) * 2}px;height:${(radius + spokeLength/2) * 2}px`} class="outline"></div>
          <div style={`width:${radius * 2}px;height:${radius * 2}px; left:${spokeLength}px; top:${spokeLength}px`} class="base-encoding circle">{[encodingsDict[trim(activeSentence.sentence)][activeDimensionality.number].map((d, i) => {
            return <div style={`transform: rotate(${-90 + i * 360/activeDimensionality.number}deg)`} class="spoke">
              <div style={`left:${radius + radiusScale(d)}px`} class="node"></div>
            </div>
          }), <svg width={radius * 2} height={radius * 2}>
                <g transform={`translate(${radius}, ${radius})`}><path></path></g>
              </svg>]}</div>
        </div>
        <div class="progressions">{sets.map(d => {
          return <div data-active={d.active} onMouseEnter={() => {
            this.changeSentence(d.id, 'sets')
          }} class="item">{d.label}</div>
        })}</div>
      </div>
    )
  }
}

export default Embeddings10D