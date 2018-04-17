import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
const { roundDown, bindAll, removeDuplicates, wrapIterator, shuffle, subVectors, dotProduct, vectorLength, manhattanLength, permute, fractional, degreesToRadians, trim } = helpers
import randomModule from '../helpers/random'
const random = randomModule.random(42)
import { scaleLinear } from 'd3-scale'
import { lineRadial } from 'd3-shape'
import { select } from 'd3-selection'

const encodings = [
  {
    "base": "i'm going to give it a marginal thumbs up . i liked it just enough .",
    "alt": [
      "i'm going to give it a thumbs up . i liked it .",
      "i'm going to give it a marginal thumbs up . i liked it okay ."
    ]
  },
  {
    "base": "a deliciously nonsensical comedy about a city coming apart at its seams .",
    "alt": [
      "a nonsensical comedy about a city coming apart at its seams .",
      "a delightfully nonsensical comedy about a city coming apart at its seams ."
    ]
  },
  {
    "base": "the story is also as unoriginal as they come , already having been recycled more times than i'd care to count .",
    "alt": [
      "the story is also as original as they come .",
      "the story is also unoriginal , already having been recycled more times than i'd care to count ."
    ]
  },
  {
    "base": "it's so laddish and juvenile , only teenage boys could possibly find it funny .",
    "alt": [
      "only teenage boys could possibly find it unfunny .",
      "teenage boys could possibly find it funny ."
    ]
  },
  {
    "base": "as saccharine as it is disposable .",
    "alt": [
      "saccharine and disposable ."
    ]
  },
  {
    "base": "a pleasant enough movie , held together by skilled ensemble actors .",
    "alt": [
      "a pleasant movie , held together by skilled ensemble actors ."
    ]
  },
  {
    "base": "everytime you think undercover brother has run out of steam , it finds a new way to surprise and amuse .",
    "alt": [
      "undercover brother always finds a new way to surprise and amuse ."
    ]
  },
  {
    "base": "this is the best american movie about troubled teens since 1998's whatever .",
    "alt": [
      "this is the best american movie about troubled teens ."
    ]
  },
  {
    "base": "just the labour involved in creating the layered richness of the imagery in this chiaroscuro of madness and light is astonishing .",
    "alt": [
      "just the labour involved in creating the layered richness of the imagery is astonishing ."
    ]
  },
  {
    "base": "the animated subplot keenly depicts the inner struggles of our adolescent heroes - insecure , uncontrolled , and intense .",
    "alt": [
      "the animated subplot keenly depicts the inner struggles of our heroes - insecure , uncontrolled , and intense ."
    ]
  },
  {
    "base": "a frisky and fresh romantic comedy exploring sexual politics and the challenges of friendships between women .",
    "alt": [
      "a frisky and fresh romantic comedy exploring sexual politics ."
    ]
  },
  {
    "base": "the invincible werner herzog is alive and well and living in la",
    "alt": [
      "werner herzog is alive and well and living in la"
    ]
  },
  {
    "base": "dark and disturbing , but also surprisingly funny .",
    "alt": [
      "dark disturbing and funny ."
    ]
  },
  {
    "base": "it's the best film of the year so far , the benchmark against which all other best picture contenders should be measured .",
    "alt": [
      "it's the best film of the year so far , the benchmark against which all others should be measured ."
    ]
  },
  {
    "base": "absorbing and disturbing -- perhaps more disturbing than originally intended -- but a little clarity would have gone a long way .",
    "alt": [
      "absorbing and disturbing but a little clarity would have gone a long way ."
    ]
  },
  {
    "base": "with the film's striking ending , one realizes that we have a long way to go before we fully understand all the sexual permutations involved .",
    "alt": [
      "we have a long way to go before we fully understand all the sexual permutations involved ."
    ]
  },
  {
    "base": "it sounds sick and twisted , but the miracle of shainberg's film is that it truly is romance",
    "alt": [
      "the miracle of shainberg's film is that it truly is romance"
    ]
  },
  {
    "base": "disturbing and brilliant documentary .",
    "alt": [
      "brilliant documentary ."
    ]
  },
  {
    "base": "very much a home video , and so devoid of artifice and purpose that it appears not to have been edited at all .",
    "alt": [
      "so devoid of artifice and purpose that it appears not to have been edited at all ."
    ]
  },
  {
    "base": "an inconsequential , barely there bit of piffle .",
    "alt": [
      "a barely there bit of piffle ."
    ]
  },
  {
    "base": "though the film's scenario is certainly not earthshaking , this depiction of fluctuating female sexuality has two winning lead performances and charm to spare .",
    "alt": [
      "this depiction of fluctuating female sexuality has two winning lead performances and charm to spare ."
    ]
  },
  {
    "base": "dazzling and sugar-sweet , a blast of shallow magnificence that only sex , scandal , and a chorus line of dangerous damsels can deliver .",
    "alt": [
      "a blast of shallow magnificence that only sex , scandal , and a chorus line of dangerous damsels can deliver ."
    ]
  },
  {
    "base": "japan's premier stylist of sex and blood hits audiences with what may be his most demented film to date .",
    "alt": [
      "japan's premier stylist of sex and blood delivers his most demented film to date ."
    ]
  }
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
    let dimensionsArr = []
    let maxDimensionality = Math.max(...Object.keys(this.props.data))

    for(let i=0; i<maxDimensionality; i++) {
      dimensionsArr.push({
        label: i,
        active: i === 0,
        id: i
      })
    }

    this.setState({
      hoverEncoding: null,
      hoverIndex: 0,
      sets: encodings.map((d, i) => {
        return {
          sentence: d.base,
          alt: d.alt,
          label: d.base,
          active: i === 0,
          id: i
        }
      }),
      dimensionsArr,
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
    let dimensions = Object.keys(this.props.data)

    encodings.forEach(item => {
      let sen = item.base
      encodingsDict[sen] = {}

      item.alt.forEach(alt => encodingsDict[alt] = {})

      dimensions.forEach(d => {
        encodingsDict[sen][d] = this.props.data[d].find(obj => obj.sentence == sen).encoding

        item.alt.forEach(alt => {
          encodingsDict[alt][d] = this.props.data[d].find(obj => obj.sentence == alt).encoding          
        })
      })
    })

    bindAll(this, ['changeSentence', 'draw'])
  }

  changeSentence(id, key) {
    if(this.state[key].find(d => d.active).id === id) return false

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

    return true
  }

  draw() {
    let activeSentence = this.state.sets.find(d => d.active)
    let activeDimensionality = this.state.dimensions.find(d => d.active)

    let hoverEncoding

    if(this.state.hoverEncoding) {
      hoverEncoding = this.state.hoverEncoding[activeDimensionality.label]
    }

    let points = [ hoverEncoding, encodingsDict[trim(activeSentence.sentence)][activeDimensionality.number] ]
    let selectors = ['.hover-encoding path', '.base-encoding path']

    points.forEach((vec, vIdx) => {
      if(vec) {
        select(document.querySelector(selectors[vIdx])).attr("d", radialLine(vec.map((d, i) => {
          let angle = degreesToRadians(i * 360/activeDimensionality.number)
          return [angle, radius + radiusScale(d)]
        })) + 'z')              
      }
    })    
  }

  componentDidMount() {
    this.draw()
  }

  componentDidUpdate() {
    this.draw()
  }

  render({}, { sets, dimensions, hoverEncoding, distances, dimensionsArr, hoverIndex }) {
    let activeSentence = sets.find(d => d.active)
    let activeDimensionality = dimensions.find(d => d.active)
    let activeSortBy = dimensionsArr.find(d => d.active).id

    let hoverCircle

    if(hoverEncoding) {
      hoverCircle = <div style={`width:${radius * 2}px;height:${radius * 2}px; left:${spokeLength}px; top:${spokeLength}px`} class="circle hover-encoding">{[hoverEncoding[activeDimensionality.label].map((d, i) => {
          return <div style={`transform: rotate(${-90 + i * 360/activeDimensionality.number}deg)`} class="spoke">
            <div style={`left:${radius + radiusScale(d)}px`} class="node"></div>
          </div>
        }), <svg width={radius * 2} height={radius * 2}>
            <g transform={`translate(${radius}, ${radius})`}><path></path></g>
          </svg>]}
        </div>      
    }

    return (
      <div id="embeddings_10d">
        <Dropdown change={id => this.changeSentence(id, 'dimensions')} options={dimensions} />
        <span>sort by:</span>
        <Dropdown change={id => this.changeSentence(id, 'dimensionsArr')} options={dimensionsArr.slice(0, activeDimensionality.id)} />
        <br/>
        <div style={`width:${radius * 2 + spokeLength * 2}px`} class="vector-wrapper">
          <div style={`left:${spokeLength/2}px;top:${spokeLength/2}px;width:${(radius + spokeLength/2) * 2}px;height:${(radius + spokeLength/2) * 2}px`} class="outline"></div>
          {hoverCircle}
          <div style={`width:${radius * 2}px;height:${radius * 2}px; left:${spokeLength}px; top:${spokeLength}px`} class="base-encoding circle">{[encodingsDict[trim(activeSentence.sentence)][activeDimensionality.number].map((d, i) => {
            return <div style={`transform: rotate(${-90 + i * 360/activeDimensionality.number}deg)`} class="spoke">
              <div style={`left:${radius + radiusScale(d)}px; background: ${i === activeSortBy ? 'orange' : '#222'}; width: ${i === activeSortBy ? 6 : 4}px; height: ${i === activeSortBy ? 6 : 4}px`} class="node"></div>
            </div>
          }), <svg width={radius * 2} height={radius * 2}>
                <g transform={`translate(${radius}, ${radius})`}><path></path></g>
              </svg>]}</div>
        </div>
        <div class="progressions">{sets.sort((a, b) => {
          let aEnc = encodingsDict[trim(a.sentence)][activeDimensionality.number]
          let bEnc = encodingsDict[trim(b.sentence)][activeDimensionality.number]
          if(aEnc[activeSortBy] > bEnc[activeSortBy]) {
            return -1
          }
          return 1
        }).map(d => {
          return <div onClick={() => {
            let updated = this.changeSentence(d.id, 'sets')

            if(updated) {
              this.setState({
                hoverEncoding: encodingsDict[trim(d.alt[0])],
                hoverIndex: 0
              })              
            }
          }} data-active={d.active} class="item">
            <div>{d.label}</div>
            <ul>{d.alt.map((alt, alti) => {
              return <li onClick={(e) => {
                if(d.active) {
                  e.stopPropagation()
                  this.setState({ 
                    hoverIndex: alti,
                    hoverEncoding: encodingsDict[trim(d.alt[alti])]
                  })                  
                }
              }} data-active={alti === hoverIndex}>{alt}</li>
            })}</ul>
          </div>
        })}</div>
      </div>
    )
  }
}

export default Embeddings10D