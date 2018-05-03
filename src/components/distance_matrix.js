import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
const { roundDown, bindAll, removeDuplicates, wrapIterator, shuffle, subVectors, dotProduct, vectorLength, manhattanLength, permute, fractional, degreesToRadians, trim, createDropdown } = helpers
import randomModule from '../helpers/random'
const random = randomModule.random(42)
import { getData, getShader } from '../api'
import { debounce } from 'underscore'
import Dropdown from './dropdown'

const vizHeight = 650
const innerContentsWidth = 960

let distances = ['euclidean', 'manhattan', 'wasserstein']
let models = ['skip_thought']
let sortBy = [{
  label: 'euclidean',
  id: 'euclidean',
  perm: [266,383,426,318,64,156,169,170,116,10,363,78,159,153,149,110,95,120,166,280,42,118,119,122,376,260,262,316,103,441,322,129,344,57,219,181,491,310,343,496,173,281,271,425,58,338,215,117,267,53,148,395,242,61,192,423,309,66,9,243,154,420,62,450,205,493,259,380,158,200,40,55,176,440,369,199,150,479,368,155,466,216,229,225,0,300,346,99,210,315,442,227,68,471,157,143,421,387,1,26,27,46,461,47,273,202,251,126,286,17,184,463,443,206,4,84,5,50,81,482,288,69,476,327,98,83,180,16,142,449,468,324,254,163,165,347,325,182,475,11,207,328,353,457,339,408,198,364,56,331,253,473,231,352,377,147,415,452,371,388,70,175,311,448,497,386,151,270,370,204,409,241,382,292,276,275,374,24,113,214,303,354,125,33,188,20,132,487,279,432,79,393,490,112,246,334,252,313,399,418,451,91,36,293,365,429,228,478,340,121,137,257,3,373,255,446,306,317,106,359,348,218,203,49,480,6,21,124,35,248,138,278,396,237,472,194,59,234,249,405,394,196,391,319,247,398,186,419,114,208,372,111,44,211,456,499,362,431,144,172,390,141,96,179,460,164,160,236,37,465,77,258,209,350,341,51,357,323,197,351,65,294,212,161,304,445,290,305,321,75,18,287,459,428,88,424,223,14,133,342,94,15,232,72,484,414,25,379,434,48,392,385,326,407,492,213,41,2,220,416,240,455,401,437,332,413,162,417,483,433,233,107,439,498,31,60,378,32,230,256,190,191,296,284,131,130,101,177,333,269,301,238,438,136,28,102,43,298,224,329,23,7,285,19,265,127,436,145,226,454,411,201,302,360,308,8,105,485,100,183,250,239,12,82,67,171,87,185,291,90,384,295,467,320,367,356,73,193,447,135,140,128,13,174,412,470,335,29,349,108,85,115,45,330,481,30,422,277,221,299,389,495,282,146,375,268,314,366,406,261,134,97,71,217,189,400,289,104,402,80,74,93,345,474,244,22,488,444,86,139,410,195,312,435,297,283,89,274,34,263,486,404,361,336,381,337,489,272,458,123,307,63,494,167,168,469,38,109,464,52,477,39,187,76,355,152,462,453,92,397,358,264,222,430,178,427,54,403,235,245]
}, {
  label: 'wasserstein',
  id: 'wasserstein',
  perm: [430,222,485,427,54,326,467,239,183,247,64,394,118,476,391,34,44,449,442,484,434,25,390,431,179,379,15,96,453,212,187,193,478,296,408,41,268,52,446,261,340,230,201,487,69,119,458,336,244,388,251,1,451,356,194,59,178,245,235,403,414,156,208,209,316,260,129,397,499,376,144,417,63,418,73,237,233,56,320,404,22,139,323,168,304,439,65,272,428,332,393,74,420,198,475,70,292,479,7,23,231,381,16,20,333,188,369,121,214,267,215,189,470,174,130,377,27,224,436,31,158,368,197,220,441,133,443,396,99,312,406,335,399,163,306,472,143,206,49,106,107,4,17,269,432,450,126,366,175,281,389,53,180,147,412,382,173,71,329,461,284,339,324,357,310,358,407,141,77,465,37,392,385,240,371,256,62,395,148,263,246,82,83,181,474,279,254,57,468,42,293,186,51,353,283,348,123,11,3,359,413,211,489,445,13,355,236,494,483,362,462,68,307,305,109,39,308,88,112,98,167,176,219,398,91,45,419,36,166,115,199,311,300,350,364,328,40,498,226,202,26,380,493,314,117,495,60,46,200,225,325,303,81,154,145,400,402,190,257,33,136,253,151,152,285,18,238,28,80,411,248,490,192,334,61,444,410,423,66,79,486,337,297,223,67,162,92,111,140,351,195,102,146,327,471,264,421,455,477,14,435,317,482,331,84,301,302,21,127,6,338,50,205,466,19,155,216,229,491,276,473,349,330,322,405,116,12,384,170,282,85,75,343,213,361,387,128,274,457,345,367,492,341,93,290,424,55,425,32,459,207,241,142,415,452,365,97,496,124,137,255,89,273,204,30,172,165,469,295,463,134,0,289,29,373,108,122,347,280,346,252,221,294,275,259,286,191,278,160,447,480,101,35,138,309,454,203,243,448,150,177,360,386,299,132,104,47,86,409,497,370,354,5,131,429,456,184,422,9,161,218,113,43,265,228,438,125,440,270,352,287,182,72,103,262,135,344,232,164,460,258,401,437,321,76,372,114,313,378,58,271,375,242,488,288,157,217,315,234,171,433,95,416,110,426,266,249,87,153,363,318,210,149,464,94,291,90,169,196,10,38,48,185,342,319,227,8,374,277,298,24,120,481,105,2,383,78,159,100,250]
}]

let dimensions = ['100'], sentences = []

class DistanceMatrix extends Component {
  constructor(props) {
    super(props)

    let data = {}, max = {}

    distances.forEach(d => {
      data[d] = {}
      max[d] = {}
      dimensions.forEach(dim => {
        data[d][dim] = null
        max[d][dim] = 0
      })
    })

    this.setState({
      canvasTop: 0,
      canvasLeft: 0,
      max,
      highlightedSentences: [],
      dragging: false,
      dimensions: dimensions.map(createDropdown),
      models: models.map(createDropdown),
      distances: distances.map(createDropdown),
      sortBy: sortBy.map((d, i) => {
        if(i === 0) {
          d.active = true
        }
        d.id = d.label
        return d
      }),
      data,
      canvasSize: 0,
      highlightRegion: {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      }
    })
  }

  componentWillMount() {
    bindAll(this, ['changeDropdown', 'draw', 'calculateSize'])

    let files = []

    for(let i=0; i<distances.length; i++) {
      for(let j=0; j<dimensions.length; j++) {
        files.push(`distance_matrix_${distances[i]}_${dimensions[j]}`)
      }
    }

    files.push('distance_matrix_sentences')

    Promise.all(files.map(getData)).then(resp => {
      sentences = resp[files.length - 1]

      let data = this.state.data
      let canvas = document.querySelector("#distance_matrix #canvas")
      this.ctx = canvas.getContext('2d')
      let keys = Object.keys(resp[0])
      let canvasSize = keys.length
      let max = this.state.max

      canvas.width = 2 * canvasSize
      canvas.height = 2 * canvasSize
      canvas.style.width = canvasSize + 'px'
      canvas.style.height = canvasSize + 'px'

      this.ctx.scale(2, 2)

      distances.forEach((d, i) => {
        dimensions.forEach((dim, dimi) => {
          data[d][dim] = resp[i * dimensions.length + dimi]
        })
      })

      for(let i=0; i<keys.length; i++) {
        let key = keys[i]
        let targetKeys = Object.keys(resp[0][key])
        for(let j=0; j<targetKeys.length; j++) {
          distances.forEach((d, i) => {
            dimensions.forEach((dim, dimi) => {
              let val = resp[i * dimensions.length + dimi][key][targetKeys[j]]

              if(val > max[d][dim]) max[d][dim] = val
            })
          })
        }
      }

      max.wasserstein['100'] = 0.02 // otherwise everything is super close

      this.setState({ data, max, canvasSize }, this.draw)
    })

    window.addEventListener("mousemove", e => {
      if(!this.state.dragging) return

      let highlightRegion = this.state.highlightRegion

      let left = e.clientX - this.state.canvasLeft
      let top = e.clientY - this.state.canvasTop

      highlightRegion.width = left - highlightRegion.x
      highlightRegion.height = top - highlightRegion.y
      this.setState({ highlightRegion})
    })

    window.addEventListener("mouseup", e => {
      if(this.state.dragging) {
        let { x, y, width, height } = this.state.highlightRegion

        let indices = []
        for(let i=0; i<width; i++) {
          indices.push(x + i)
        }

        for(let i=0; i<height; i++) {
          if(indices.indexOf(y + i) === -1) indices.push(y + i)
        }

        this.setState({ 
          dragging: false,
          highlightedSentences: indices.map(index => {
            return {
              index,
              sentence: sentences[index].sentence
            }
          })
        })
      }
    })

    window.addEventListener("scroll", debounce(this.calculateSize, 200))
  }

  componentDidMount() {
    this.calculateSize()
    this.draw()
  }

  draw() {
    let { data, max, dimensions, distances, sortBy } = this.state
    let activeDim = dimensions.find(d => d.active).label
    let activeDistance = distances.find(d => d.active).label
    let activeData = data[activeDistance][activeDim]
    let activeMax = max[activeDistance][activeDim]
    let perm = sortBy.find(d => d.active).perm

    if(activeData) {
      let keys = Object.keys(activeData)
      let size = keys.length

      this.ctx.clearRect(0, 0, size, size)

      for(let row=0; row<size; row++) {
        let key = keys[row]
        for(let col=0; col<size; col++) {
          let target = keys[col]

          let val = activeData[key][target]
          if(typeof val === 'undefined') {
            val = activeData[target][key]
          }

          if(key === target) {
            val = 0
          }

          this.ctx.fillStyle = `rgba(0, 0, 0, ${1 - (val / activeMax)})`
          this.ctx.fillRect(perm.indexOf(col), perm.indexOf(row), 1, 1)
          // this.ctx.fillRect(col, row, 1, 1)
        }
      }
    }
  }

  calculateSize() {
    let rect = document.querySelector("#distance_matrix #canvas").getBoundingClientRect()

    this.setState({
      canvasLeft: Math.round(rect.left),
      canvasTop: Math.round(rect.top)
    })
  }

  changeDropdown(id, key) {
    this.setState({
      [key]: this.state[key].map(d => {
        if(d.id == id) {
          d.active = true
        } else {
          d.active = false
        }

        return d
      })
    }, this.draw)
  }

  render({}, { models, distances, sortBy, dimensions, data, highlightRegion, canvasSize, canvasLeft, canvasTop, highlightedSentences}) {

    let sentences = null

    if(highlightedSentences.length) {
      sentences = highlightedSentences.map(d => {
        return <div class="sentence">{d.index + ': ' + d.sentence}</div>
      })
    }

    return (
      <div class="inset_visualization" id="distance_matrix">
        <div style={`height:${vizHeight}px`} class="buffer"></div>
        <div style={`height:${vizHeight}px`} class="contents">
          <div style={`width:${innerContentsWidth}px`} class="inner-contents">
            <div style={`width:${canvasSize}px`} class="left">
              <h4 class="side-header">Distance Matrix</h4>
              <div class="dropdown-wrapper">
                <h4 class="label">Model</h4>
                <Dropdown change={id => this.changeDropdown(id, 'models')} options={models} />
              </div>
              <div class="dropdown-wrapper">
                <h4 class="label">Color by</h4>
                <Dropdown change={id => this.changeDropdown(id, 'distances')} options={distances} />
              </div>
              <div class="dropdown-wrapper">
                <h4 class="label">Sort by</h4>
                <Dropdown change={id => {
                  this.changeDropdown(id, 'sortBy')
                  this.setState({
                    highlightRegion: {
                      x: 0,
                      y: 0,
                      width: 0,
                      height: 0
                    },
                    highlightedSentences: []
                  })
                }} options={sortBy} />
              </div>
              <br/>
              <div onMouseDown={e => {
                highlightRegion.x = e.clientX - canvasLeft
                highlightRegion.y = e.clientY - canvasTop
                highlightRegion.width = 0
                highlightRegion.height = 0

                this.setState({ 
                  dragging: true,
                  highlightRegion
                })
              }} style={`width:${canvasSize}px;height:${canvasSize}px`} class="canvas_wrapper">
                <canvas id="canvas"></canvas>
                <div style={`width:${highlightRegion.width}px;height:${highlightRegion.height}px;top:${highlightRegion.y}px;left:${highlightRegion.x}px;`} class="highlight-region"></div>
              </div>
            </div>
            <div style={`width:calc(100% - ${canvasSize}px)`} id="highlighted_sentences">
              <h4 class="side-header">HIGHLIGHTED SENTENCES</h4>
              {sentences}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default DistanceMatrix