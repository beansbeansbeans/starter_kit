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
  "the story is also as unoriginal as they come , already having been recycled more times than i'd care to count .",
  "it's so laddish and juvenile , only teenage boys could possibly find it funny .",
  "exploitative and largely devoid of the depth or sophistication that would make watching such a graphic treatment of the crimes bearable .",
  "an inconsequential , barely there bit of piffle .",
  "the abiding impression , despite the mild hallucinogenic buzz , is of overwhelming waste -- the acres of haute couture can't quite conceal that there's nothing resembling a spine here .",
  "as saccharine as it is disposable .",
  "you come away thinking not only that kate isn't very bright , but that she hasn't been worth caring about and that maybe she , janine and molly -- an all-woman dysfunctional family -- deserve one another .",
  "the metaphors are provocative , but too often , the viewer is left puzzled by the mechanics of the delivery .",
  "very much a home video , and so devoid of artifice and purpose that it appears not to have been edited at all .",
  "everytime you think undercover brother has run out of steam , it finds a new way to surprise and amuse .",
  "a pleasant enough movie , held together by skilled ensemble actors .",
  "this is the best american movie about troubled teens since 1998's whatever .",
  "just the labour involved in creating the layered richness of the imagery in this chiaroscuro of madness and light is astonishing .",
  "the animated subplot keenly depicts the inner struggles of our adolescent heroes - insecure , uncontrolled , and intense .",
  "the invincible werner herzog is alive and well and living in la",
  "haneke challenges us to confront the reality of sexual aberration .",
  "absorbing and disturbing -- perhaps more disturbing than originally intended -- but a little clarity would have gone a long way .",
  "it's the best film of the year so far , the benchmark against which all other best picture contenders should be measured .",
  "with the film's striking ending , one realizes that we have a long way to go before we fully understand all the sexual permutations involved .",
  "dark and disturbing , but also surprisingly funny .",
  "it sounds sick and twisted , but the miracle of shainberg's film is that it truly is romance",
  "disturbing and brilliant documentary .",
  "a frisky and fresh romantic comedy exporing sexual politics and the challenges of friendships between women .",
  "though the film's scenario is certainly not earthshaking , this depiction of fluctuating female sexuality has two winning lead performances and charm to spare .",
  "dazzling and sugar-sweet , a blast of shallow magnificence that only sex , scandal , and a chorus line of dangerous damsels can deliver .",
  "japan's premier stylist of sex and blood hits audiences with what may be his most demented film to date ."
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
      sets: encodings.map((d, i) => {
        return {
          sentence: d,
          label: d,
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

  render({}, { sets, dimensions, hoverEncoding, distances, dimensionsArr }) {
    let activeSentence = sets.find(d => d.active)
    let activeDimensionality = dimensions.find(d => d.active)
    let activeSortBy = dimensionsArr.find(d => d.active).id

    return (
      <div id="embeddings_10d">
        <Dropdown change={id => this.changeSentence(id, 'dimensions')} options={dimensions} />
        <span>sort by:</span>
        <Dropdown change={id => this.changeSentence(id, 'dimensionsArr')} options={dimensionsArr.slice(0, activeDimensionality.id)} />
        <br/>
        <div style={`width:${radius * 2 + spokeLength * 2}px`} class="vector-wrapper">
          <div style={`left:${spokeLength/2}px;top:${spokeLength/2}px;width:${(radius + spokeLength/2) * 2}px;height:${(radius + spokeLength/2) * 2}px`} class="outline"></div>
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
          return <div data-active={d.active} onMouseEnter={() => {
            this.changeSentence(d.id, 'sets')
          }} class="item">{d.label}</div>
        })}</div>
      </div>
    )
  }
}

export default Embeddings10D