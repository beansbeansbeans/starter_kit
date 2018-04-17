import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
const { roundDown, bindAll, removeDuplicates, wrapIterator, shuffle, subVectors, dotProduct, vectorLength, manhattanLength, permute, fractional, degreesToRadians, trim } = helpers
import { encodings } from '../config'
import randomModule from '../helpers/random'
const random = randomModule.random(42)
import { scaleLinear } from 'd3-scale'
import { lineRadial, line } from 'd3-shape'
import { select } from 'd3-selection'
import { getData, getShader } from '../api'

const progressions = ['forwards', 'backwards', 'scrambled']
const radius = 100
const spokeLength = 50
const graphHeight = 100
const graphXIncrement = 10

let radiusScale = scaleLinear().domain([-0.1, 0.1]).range([0, spokeLength])
let radialLine = lineRadial()
let encodingsDict = {}
let wassersteinPairwise
let sentenceDict = {}

const getDistance = {
  'euclidean': vectorLength,
  'manhattan': manhattanLength,
  'fractional': fractional(0.5),
  'wasserstein': function(vec, startIndex, endIndex, dim) {
    return wassersteinPairwise[dim][startIndex][endIndex]
  }
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

class Permutations extends Component {
  constructor(props) {
    super(props)

    let sentences = [
      "i'm going to give it a marginal thumbs up . i liked it just enough .",
      "a deliciously nonsensical comedy about a city coming apart at its seams ."
    ]

    let distances = ['euclidean', 'manhattan', 'fractional', 'wasserstein']

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
      }),
      distance: 0,
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

    Promise.all(['pairwise_wasserstein_permutations', 'sentence_to_index'].map(getData)).then(resp => {
      wassersteinPairwise = resp[0]
      sentenceDict = resp[1]
    })

    let dimensions = Object.keys(this.props.data)

    encodings.forEach(sen => {
      encodingsDict[sen] = {}

      dimensions.forEach(d => {
        encodingsDict[sen][d] = this.props.data[d].find(obj => obj.sentence == sen).encoding
      })
    })

    console.log(encodingsDict)

    bindAll(this, ['changeSentence', 'getProgression', 'getProgressionItems'])
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

  getProgressionItems(activeSentence, words, progression) {
    let items = []

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

    return items
  }

  getProgression(activeSentence, progression) {
    let words = activeSentence.sentence.split(" ")
    let items = this.getProgressionItems(activeSentence, words, progression)
    let dimensionality = this.state.dimensions.find(d => d.active).number
    let activeDistance = this.state.distances.find(d => d.active)

    return <div>{items.map((d, i) => {
      return <div class="item" onMouseEnter={() => {
        let activeSentence = this.state.sets.find(d => d.active)
        let sourceEncoding = encodingsDict[activeSentence.sentence][dimensionality]
        let sourceIndex = sentenceDict[activeSentence.sentence]
        let hoverEncoding = encodingsDict[trim(d)][dimensionality]
        let targetIndex = sentenceDict[trim(d)]
        let distance = getDistance[activeDistance.id](subVectors(hoverEncoding, sourceEncoding), sourceIndex, targetIndex, dimensionality)

        this.setState({ 
          hoverEncoding,
          distance,
          hoverIndex: i,
          activeProgression: progression
        })
      }}>{d}</div>
    })}</div>
  }

  componentDidUpdate() {
    let activeSentence = this.state.sets.find(d => d.active)
    let activeDimensionality = this.state.dimensions.find(d => d.active)
    let activeDistance = this.state.distances.find(d => d.active)
    let sourceEncoding = encodingsDict[activeSentence.sentence][activeDimensionality.number]
    let sourceIndex = sentenceDict[activeSentence.sentence]

    let points = [ this.state.hoverEncoding, encodingsDict[activeSentence.sentence][activeDimensionality.number] ]
    let selectors = ['.hover-encoding path', '.base-encoding path']

    points.forEach((vec, vIdx) => {
      select(document.querySelector(selectors[vIdx])).attr("d", radialLine(vec.map((d, i) => {
        let angle = degreesToRadians(i * 360/activeDimensionality.number)
        return [angle, radius + radiusScale(d)]
      })) + 'z')      
    })

    let sparklinePoints = progressions.map(p => {
      let items = this.getProgressionItems(activeSentence, activeSentence.sentence.split(" "), p)
      return items.map(item => {
        let hoverEncoding = encodingsDict[trim(item)][activeDimensionality.number]
        let targetIndex = sentenceDict[trim(item)]
        return getDistance[activeDistance.id](subVectors(hoverEncoding, sourceEncoding), sourceIndex, targetIndex, activeDimensionality.number)
      })
    })

    progressions.forEach((p, pi) => {
      let max = sparklinePoints[pi].reduce((acc, curr) => {
        if(curr > acc) {
          return curr
        }
        return acc
      }, 0)

      select(document.querySelector(`#g_${p}`)).select("path")
        .attr("d", line().x((d, i) => i * graphXIncrement).y(d => (1 - (d / max)) * graphHeight)(sparklinePoints[pi]))
    })
  }

  render({}, { sets, dimensions, hoverEncoding, distances, distance, hoverIndex, activeProgression }) {
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
        <Dropdown change={id => this.changeSentence(id, 'distances')} options={distances} />
        <br/>
        <div style={`width:${radius * 2 + spokeLength * 2}px`} class="vector-wrapper">
          <div style={`left:${spokeLength/2}px;top:${spokeLength/2}px;width:${(radius + spokeLength/2) * 2}px;height:${(radius + spokeLength/2) * 2}px`} class="outline"></div>
          {hoverCircle}
          <div style={`width:${radius * 2}px;height:${radius * 2}px; left:${spokeLength}px; top:${spokeLength}px`} class="base-encoding circle">{[encodingsDict[activeSentence.sentence][activeDimensionality.number].map((d, i) => {
            return <div style={`transform: rotate(${-90 + i * 360/activeDimensionality.number}deg)`} class="spoke">
              <div style={`left:${radius + radiusScale(d)}px`} class="node"></div>
            </div>
          }), <svg width={radius * 2} height={radius * 2}>
                <g transform={`translate(${radius}, ${radius})`}><path></path></g>
              </svg>]}</div>
          <div style={`left:${radius + spokeLength}px;top:${radius + spokeLength}px;`} id="distance-label">{`DISTANCE: ${distance.toFixed(3)}`}</div>
        </div>
        <div class="progressions">{progressions.map(p => {
          let label = <div class="label">{p.toUpperCase()}</div>
          let items = this.getProgression(activeSentence, p)
          return <div class="progression">{[label, items]}</div>
        })}</div>
        <div class="sparklines">
          <svg>
            {progressions.map((d, di) => <g transform={`translate(0, ${di * graphHeight + 20 * di})`} id={`g_${d}`}>
              <line y1="0" y2={graphHeight} x1={graphXIncrement * hoverIndex} x2={graphXIncrement * hoverIndex} stroke={d === activeProgression ? "orange" : "transparent"}></line>
              <path></path>
            </g>)}
          </svg>
        </div>
      </div>
    )
  }
}

export default Permutations