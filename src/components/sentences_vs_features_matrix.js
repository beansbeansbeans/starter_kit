import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
import { getData, getShader } from '../api'
const { bindAll } = helpers

const vizHeight = 600
const innerContentsWidth = 900

class SentencesVsFeaturesMatrix extends Component {
  constructor(props) {
    super(props)

    this.setState({})
  }

  draw() {
    let canvas = this.root.querySelector("canvas")

    console.log(this.sentences)

    let cellSize = 2

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

    for(let i=0; i<this.sentences.length; i++) {
      for(let row=0; row<this.sentences[0].encoding.length; row++) {
        let val = this.sentences[i].encoding[row]
        this.ctx.fillStyle = `rgba(0, 0, 0, ${(val - min) / (max - min)})`
        this.ctx.fillRect(i * cellSize, row * cellSize, cellSize, cellSize)
      }
    }
  }

  componentWillMount() {
    bindAll(this, ['draw'])

    Promise.all(['didion_encodings_pca_500'].map(getData)).then(resp => {
      this.sentences = resp[0]
      this.draw()
    })
  }

  render() {
    return (
      <div ref={ c => this.root=c } class="inset_visualization" id="sentences_vs_features_matrix">
        <div style={`height:${vizHeight}px`} class="buffer"></div>
        <div style={`height:${vizHeight}px`} class="contents">
          <div style={`width:${innerContentsWidth}px`} class="inner-contents">
            <div class="canvas-wrapper">
              <canvas></canvas>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default SentencesVsFeaturesMatrix