import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
import { getData, getShader } from '../api'
const { bindAll, permute, createDropdown } = helpers
import { interpolateRdGy } from 'd3-scale-chromatic'
import { debounce } from 'underscore'
import Dropdown from './dropdown'

const vizHeight = 600
const innerContentsWidth = 900
let cellSize = 2

let models = ['skip-thought']
let dimensions = [100]
let stories = ['didion']

class SentencesVsFeaturesMatrix extends Component {
  constructor(props) {
    super(props)

    this.setState({
      canvasLeft: 0,
      canvasTop: 0,
      canvasWidth: 0,
      canvasHeight: 0,
      sentence: -1,
      models: models.map(createDropdown),
      dimensions: dimensions.map(createDropdown),
      stories: stories.map(createDropdown)
    })
  }

  draw() {
    let canvas = this.root.querySelector("canvas")

    this.ctx = canvas.getContext('2d')
    let width = this.sentences.length * cellSize
    let height = this.sentences[0].encoding.length * cellSize

    canvas.width = 2 * width
    canvas.height = 2 * height

    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'

    this.ctx.scale(2, 2)

    let min = 100, max = -100
    for(let i=0; i<this.sentences.length; i++) {
      let encodings = this.sentences[i].encoding

      for(let j=0; j<encodings.length; j++) {
        let val = encodings[j]

        if(val > max) max = val
        if(val < min) min = val
      }
    }

    console.log(min, max)

    // min += 0.2
    // max -= 0.2

    min = -0.35
    max = 0.35

    for(let i=0; i<this.sentences.length; i++) {
      for(let row=0; row<this.sentences[0].encoding.length; row++) {
        let val = this.sentences[i].encoding[row]
        val = (val - min) / (max - min)

        this.ctx.fillStyle = interpolateRdGy(val)
        this.ctx.fillRect(i * cellSize, row * cellSize, cellSize, cellSize)
      }
    }
  }

  calculateSize() {
    let rect = this.root.querySelector("canvas").getBoundingClientRect()

    this.setState({
      canvasLeft: Math.round(rect.left),
      canvasTop: Math.round(rect.top),
      canvasWidth: rect.width,
      canvasHeight: rect.height
    })
  }

  componentWillMount() {
    bindAll(this, ['draw', 'calculateSize', 'changeDropdown'])

    Promise.all(['didion_encodings_pca_500', 'didion_tsne'].map(getData)).then(resp => {
      let permArray = []
      for(let i=0; i<resp[1].length; i++) permArray.push(i)

      permArray.sort((a, b) => resp[1][a] - resp[1][b])

      this.sentences = resp[0].map(d => {
        d.encoding = permute(d.encoding, permArray)
        return d
      })

      this.draw()
      setTimeout(this.calculateSize, 0)
    })

    window.addEventListener("mousemove", e => {
      if(!this.sentences) return

      let left = e.clientX - this.state.canvasLeft
      let index = Math.floor(left / cellSize)

      this.setState({ sentence: index > 0 && index < this.sentences.length ? index : -1 })
    })

    window.addEventListener("scroll", debounce(this.calculateSize, 200))
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

  render({}, { sentence, canvasWidth, canvasHeight, models, dimensions, stories }) {

    return (
      <div ref={ c => this.root=c } class="inset_visualization" id="sentences_vs_features_matrix">
        <div style={`height:${vizHeight}px`} class="buffer"></div>
        <div style={`height:${vizHeight}px`} class="contents">
          <div style={`width:${innerContentsWidth}px`} class="inner-contents">
            <div style={`width:${canvasWidth}px;`} class="canvas-wrapper">
              <div class="dropdown-wrapper-wrapper">
                <div class="dropdown-wrapper">
                  <h4 class="label">Stories</h4>
                  <Dropdown change={id => this.changeDropdown(id, 'stories')} options={stories} />
                </div>
                <div class="dropdown-wrapper">
                  <h4 class="label">Models</h4>
                  <Dropdown change={id => this.changeDropdown(id, 'models')} options={models} />
                </div>
                <div class="dropdown-wrapper">
                  <h4 class="label">Dimensions</h4>
                  <Dropdown change={id => this.changeDropdown(id, 'dimensions')} options={dimensions} />
                </div>
              </div>
              <canvas></canvas>
              <div data-active={sentence > -1} style={`height:${canvasHeight}px;left:${sentence * cellSize - 1}px`} class="mask"></div>
            </div>
            <div style={`width:${canvasWidth}px`} class="active-sentence">{sentence > -1 ? this.sentences[sentence].sentence : ''}</div>
          </div>
        </div>
      </div>
    )
  }
}

export default SentencesVsFeaturesMatrix