import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
import { getData, getShader } from '../api'
const { bindAll, permute } = helpers
import { interpolateRdGy } from 'd3-scale-chromatic'
import { debounce } from 'underscore'

const vizHeight = 600
const innerContentsWidth = 900
let cellSize = 2

class SentencesVsFeaturesMatrix extends Component {
  constructor(props) {
    super(props)

    this.setState({
      canvasLeft: 0,
      canvasTop: 0,
      canvasWidth: 0,
      canvasHeight: 0,
      sentence: -1
    })
  }

  draw() {
    let canvas = this.root.querySelector("canvas")

    console.log(this.sentences)

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

    min = -0.4
    max = 0.4

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
    bindAll(this, ['draw', 'calculateSize'])

    Promise.all(['didion_encodings_pca_500', 'didion_tsne'].map(getData)).then(resp => {
      let permArray = []
      for(let i=0; i<resp[1].length; i++) permArray.push(i)

      permArray.sort((a, b) => resp[1][a] - resp[1][b])

      this.sentences = resp[0].map(d => {
        d.encoding = permute(d.encoding, permArray)
        return d
      })

      this.draw()
      this.calculateSize()
    })

    window.addEventListener("mousemove", e => {
      if(!this.sentences) return

      let left = e.clientX - this.state.canvasLeft
      let index = Math.round(left / cellSize)

      this.setState({ sentence: index > 0 && index < this.sentences.length ? index : -1 })
    })

    window.addEventListener("scroll", debounce(this.calculateSize, 200))
  }

  render({}, { sentence, canvasWidth }) {
    return (
      <div ref={ c => this.root=c } class="inset_visualization" id="sentences_vs_features_matrix">
        <div style={`height:${vizHeight}px`} class="buffer"></div>
        <div style={`height:${vizHeight}px`} class="contents">
          <div style={`width:${innerContentsWidth}px`} class="inner-contents">
            <div class="canvas-wrapper">
              <canvas></canvas>
            </div>
            <div style={`width:${canvasWidth}px`} class="active-sentence">{sentence > -1 ? this.sentences[sentence].sentence : ''}</div>
          </div>
        </div>
      </div>
    )
  }
}

export default SentencesVsFeaturesMatrix