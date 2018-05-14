import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
const { roundDown, bindAll, removeDuplicates, wrapIterator, shuffle, subVectors, dotProduct, vectorLength, manhattanLength, permute, fractional, degreesToRadians, trim, createDropdown } = helpers
import randomModule from '../helpers/random'
const random = randomModule.random(42)
import { getData, getShader } from '../api'
import { debounce } from 'underscore'
import Dropdown from './dropdown'

const vizHeight = 725
const innerContentsWidth = 960
const canvasSize = 500

let corpora = ['movies', 'guns']
let dimensions = [100]
let distances = ['euclidean', 'cosine', 'emd-norm', 'minkowski-10']
let models = ['glove', 'doc2vec']

let presets = [ // dummy
  {
    model: 'skip_thought',
    distance: 'euclidean',
    topLeft: [170, 260],
    bottomRight: [184, 457],
    description: "These sentences all have this unusual thing in common."
  },
  {
    model: 'skip_thought',
    distance: 'wasserstein',
    topLeft: [170, 170],
    bottomRight: [110, 110],
    description: "These sentences all have this unusual thing in common."
  }
]

let sentences = {}

class DistanceMatrix extends Component {
  constructor(props) {
    super(props)

    let data = {}, max = {}

    corpora.forEach(c => {
      data[c] = {}
      max[c] = {}
      models.forEach(m => {
        data[c][m] = {}
        max[c][m] = {}
        distances.forEach(d => {
          data[c][m][d] = {}
          max[c][m][d] = {}

          dimensions.forEach(dim => {
            data[c][m][d][dim] = null
            max[c][m][d][dim] = 0
          })
        })
      })
    })

    this.setState({
      canvasTop: 0,
      canvasLeft: 0,
      max,
      highlightedSentences: [],
      dragging: false,
      corpora: corpora.map(createDropdown),
      models: models.map(createDropdown),
      dimensions: dimensions.map(createDropdown),
      distances: distances.map(createDropdown),
      sortBy: distances.slice(0).map(createDropdown),
      presets: presets.map(d => {
        d.active = false
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
    bindAll(this, ['changeDropdown', 'draw', 'calculateSize', 'updateHighlightedSentences'])

    let files = []

    for(let c=0; c<corpora.length; c++) {
      for(let m=0; m<models.length; m++) {
        for(let i=0; i<distances.length; i++) {
          for(let j=0; j<dimensions.length; j++) {
            files.push(`distance_matrix_viz/${corpora[c]}_${models[m]}_${distances[i]}_${dimensions[j]}`)
            files.push(`distance_matrix_viz/${corpora[c]}_${models[m]}_${distances[i]}_${dimensions[j]}_perm`)
          }
        }
      }      
    }

    corpora.forEach(c => files.push(`distance_matrix_viz/${c}_sentences`))

    console.log(files)

    Promise.all(files.map(getData)).then(resp => {
      corpora.forEach((c, ci) => {
        sentences[c] = resp[files.length - (corpora.length - ci)]
      })

      let data = this.state.data
      let canvas = document.querySelector("#distance_matrix #canvas")
      this.ctx = canvas.getContext('2d')
      let keys = Object.keys(resp[0])
      let max = this.state.max

      canvas.width = 2 * canvasSize
      canvas.height = 2 * canvasSize
      canvas.style.width = canvasSize + 'px'
      canvas.style.height = canvasSize + 'px'

      this.ctx.scale(2, 2)

      corpora.forEach((c, ci) => {
        models.forEach((m, mi) => {
          distances.forEach((d, i) => {
            dimensions.forEach((dim, dimi) => {
              let corpusBatchLength = models.length * distances.length * dimensions.length * 2
              let modelBatchLength = distances.length * dimensions.length * 2 // * 2 because also fetching perm
              data[c][m][d][dim] = resp[ci * corpusBatchLength + mi * modelBatchLength + i * dimensions.length * 2 + dimi]
              data[c][m][d][`${dim}_perm`] = resp[ci * corpusBatchLength + mi * modelBatchLength + i * dimensions.length * 2 + dimi + 1]
            })
          })        
        })        
      })

      for(let i=0; i<keys.length; i++) {
        let key = keys[i]
        let targetKeys = Object.keys(resp[0][key])
        for(let j=0; j<targetKeys.length; j++) {
          corpora.forEach((c, ci) => {
            models.forEach((m, mi) => {
              distances.forEach((d, i) => {
                dimensions.forEach((dim, dimi) => {
                  let corpusBatchLength = models.length * distances.length * dimensions.length * 2
                  let modelBatchLength = distances.length * dimensions.length * 2 
                  let val = resp[ci * corpusBatchLength + mi * modelBatchLength + i * dimensions.length * 2 + dimi][key][targetKeys[j]]

                  if(val > max[c][m][d][dim]) max[c][m][d][dim] = val
                })
              })            
            })            
          })
        }
      }

      // max.wasserstein['100'] = 0.02 // otherwise everything is super close

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
        this.updateHighlightedSentences()
      }
    })

    window.addEventListener("scroll", debounce(this.calculateSize, 200))
  }

  updateHighlightedSentences() {
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
          sentence: sentences[this.state.corpora.find(d => d.active).label][index]
        }
      })
    })
  }

  componentDidMount() {
    this.calculateSize()
  }

  draw() {
    let { data, max, dimensions, distances, sortBy, models, corpora } = this.state
    let activeCorpus = corpora.find(d => d.active).label
    let activeDim = dimensions.find(d => d.active).label
    let activeModel = models.find(d => d.active).label
    let activeDistance = distances.find(d => d.active).label
    let activeData = data[activeCorpus][activeModel][activeDistance][activeDim]
    let activeMax = max[activeCorpus][activeModel][activeDistance][activeDim]
    let activeSortBy = sortBy.find(d => d.active).label
    let perm = data[activeCorpus][activeModel][activeSortBy][`${activeDim}_perm`]

    if(activeData) {
      let keys = Object.keys(activeData)
      let size = keys.length

      this.ctx.clearRect(0, 0, canvasSize, canvasSize)

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
          this.ctx.fillRect((perm.indexOf(col) * canvasSize) / size, (perm.indexOf(row) * canvasSize) / size, canvasSize / size, canvasSize / size)
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

  render({}, { models, distances, sortBy, dimensions, data, highlightRegion, canvasSize, canvasLeft, canvasTop, highlightedSentences, presets, corpora }) {

    let sentences = null

    if(highlightedSentences.length) {
      sentences = highlightedSentences.map(d => {
        return <div class="sentence">{d.index + ': ' + d.sentence}</div>
      })
    }

    let presetDescription = null

    let activePresetIndex = presets.findIndex(d => d.active)

    if(activePresetIndex > -1) {
      presetDescription = <div class="preset-description"><span>{`Preset ${activePresetIndex}:`}</span>{`${presets[activePresetIndex].description}`}</div>
    }

    return (
      <div class="inset_visualization" id="distance_matrix">
        <div style={`height:${vizHeight}px`} class="buffer"></div>
        <div style={`height:${vizHeight}px`} class="contents">
          <div style={`width:${innerContentsWidth}px`} class="inner-contents">
            <div style={`width:${canvasSize}px`} class="left">
              <h4 class="side-header">Distance Matrix</h4>
              <div class="dropdown-wrapper">
                <h4 class="label">Corpora</h4>
                <Dropdown change={id => this.changeDropdown(id, 'corpora')} options={corpora} />
              </div>
              <div class="dropdown-wrapper">
                <h4 class="label">Model</h4>
                <Dropdown change={id => this.changeDropdown(id, 'models')} options={models} />
              </div>
              <div class="dropdown-wrapper">
                <h4 class="label">Color</h4>
                <Dropdown change={id => this.changeDropdown(id, 'distances')} options={distances} />
              </div>
              <div class="dropdown-wrapper">
                <h4 class="label">Sort</h4>
                <Dropdown change={id => {
                  this.changeDropdown(id, 'sortBy')
                  this.setState({
                    highlightRegion: { x: 0, y: 0, width: 0, height: 0 },
                    highlightedSentences: []
                  })
                }} options={sortBy} />
              </div>
              <br/>
{/*              <div class="presets">
                <h4 class="label">Presets</h4>
                <div class="preset-options">{presets.map((d, i) => {
                  return <div onClick={e => {
                    let newPresets = presets.map((p, pi) => {
                      if(pi === i) {
                        p.active = !d.active
                      } else {
                        p.active = false
                      }
                      return p
                    })

                    let newState = { presets: newPresets }

                    let activePreset = newPresets.find(d => d.active)

                    if(activePreset) {
                      this.changeDropdown(activePreset.distance, 'sortBy')
                      this.changeDropdown(activePreset.distance, 'distances')
                      this.changeDropdown(activePreset.model, 'models')

                      let { perm } = sortBy.find(d => d.id === activePreset.distance)

                      this.setState(Object.assign({
                        highlightRegion: {
                          x: perm.indexOf(activePreset.topLeft[0]),
                          y: perm.indexOf(activePreset.topLeft[1]),
                          width: perm.indexOf(activePreset.bottomRight[0]) - perm.indexOf(activePreset.topLeft[0]),
                          height: perm.indexOf(activePreset.bottomRight[1]) - perm.indexOf(activePreset.topLeft[1])                          
                        }
                      }, newState), this.updateHighlightedSentences)
                    } else {
                      this.setState(Object.assign({
                        highlightRegion: { x: 0, y: 0, width: 0, height: 0 },
                        highlightedSentences: []
                      }, newState))
                    }
                  }} data-active={d.active} class="preset">{i}</div>
                })}</div>
              </div>*/}
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
              {presetDescription}
              <div class="sentences-wrapper">{sentences}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default DistanceMatrix