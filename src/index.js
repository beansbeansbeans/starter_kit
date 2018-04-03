import { h, render, Component } from 'preact'
import helpers from './helpers/helpers'
const { roundDown, bindAll, removeDuplicates, wrapIterator, shuffle, subVectors, dotProduct, vectorLength } = helpers
import "../main.scss"
import { getData, getShader } from './api'
import { debounce, defer } from 'underscore'
import sharedState from './sharedState'
import mediator from './mediator'
import { handleResize } from './listeners'
import model from './model/index'
import randomModule from './helpers/random'
const random = randomModule.random(42)

const size = 20

let shaderFiles = [], web, mouseX, mouseY, directory = {}, embeddings
let canvasRenderWidth, canvasRenderHeight, canvas, ctx, maxDensity, cellDim, canvasXOffset, canvasYOffset

const shaders = {},
  preload = {
    getShaders: () =>
      Promise.all(shaderFiles.map(getShader)).then(data => {
        for(let i=0; i<data.length; i++) shaders[shaderFiles[i]] = data[i]
        return data
      })
    ,
    getData: () => 
      Promise.all(['encodings_pca'].map(getData))
        .then(data => embeddings = shuffle(data[0]))
  }

class Dropdown extends Component {
  render({ options, change }) {
    return (
      <select onChange={e => change(e.target.value)} class="options">
        {options.map(d => {
          return <option 
            onClick={() => {
              change(d.id)
            }}
            value={d.index}
            selected={d.selected} class="option">{d.sentence}</option>
        })}
      </select>
    )
  }
}

class App extends Component {
  state = { 
    startIndex: 0,
    endIndex: 0,
    targetOptions: [],
    intermediaries: [],
    densities: []
  }

  componentWillMount() {
    bindAll(this, ['updateIntermediaries', 'drawDensities', 'userSelectTarget', 'clickCanvas'])
  }

  componentDidMount() {
    let targets = [
      'lan yu is a genuine love story , full of traditional layers of awakening and ripening and separation and recovery',
      "all mixed up together like a term paper from a kid who can't quite distinguish one sci-fi work from another",
      'a tour de force of modern cinema'
    ]

    let targetIndices = targets.map(d => this.props.data.findIndex(obj => obj.sentence.indexOf(d) > -1))

    let targetIndex = targetIndices[0]

    this.setState({
      startIndex: this.props.data.findIndex(d => d.sentence.indexOf('simplistic , silly and tedious') > -1),
      endIndex: targetIndex,
      targetOptions: targetIndices.map((d, i) => ({
        index: d,
        sentence: this.props.data[d].sentence,
        selected: i === 0
      }))
    })

    canvas = document.getElementById('canvas')
    ctx = canvas.getContext('2d')

    let windowDim = Math.min(window.innerWidth, window.innerHeight)
    let canvasDim = 0.5 * windowDim
    let width = size
    let height = width
    cellDim = canvasDim / Math.max(height, width)
    canvasRenderWidth = cellDim * width
    canvasRenderHeight = cellDim * height

    canvasXOffset = (window.innerWidth / 2) - (canvasRenderWidth / 2)
    canvasYOffset = (window.innerHeight / 2) - (canvasRenderHeight / 2)

    canvas.width = 2 * canvasRenderWidth
    canvas.height = 2 * canvasRenderHeight
    canvas.style.width = (canvasRenderWidth) + 'px'
    canvas.style.height = (canvasRenderHeight) + 'px'

    ctx.scale(2, 2)
  }

  updateIntermediaries() {
    let { data } = this.props
    let { startIndex, endIndex } = this.state

    let A = data[startIndex].encoding
    let B = data[endIndex].encoding

    let buckets = []
    for(let i=0; i<1; i+=0.05) buckets.push([])

    let densities = []
    for(let i=0; i<1; i+=0.05) {
      densities.push([])
      for(let j=0; j<1; j+=0.05) {
        densities[densities.length - 1].push([])
      }
    }

    let min = Infinity, max = 0
    let minDistance = Infinity, maxDistance = 0
    let distances = []

    maxDensity = 0

    for(let i=0; i<data.length; i++) {
      if(i === startIndex || i === endIndex) continue
      let P = data[i].encoding

      let pa = subVectors(P, A)
      let ba = subVectors(B, A)
      let bp = subVectors(B, P)

      let startDistance = vectorLength(pa)
      let endDistance = vectorLength(bp)
      distances.push([startDistance, endDistance, data[i].sentence])

      if(startDistance < minDistance) minDistance = startDistance
      if(endDistance < minDistance) minDistance = endDistance
      if(startDistance > maxDistance) maxDistance = startDistance
      if(endDistance > maxDistance) maxDistance = endDistance

      let t = dotProduct(pa, ba) / dotProduct(ba, ba)
      let tba = []
      for(let j=0; j<ba.length; j++) {
        tba.push(t * ba[j])
      }

      let paMinusTba = []
      for(let j=0; j<pa.length; j++) {
        paMinusTba.push(pa[j] - tba[j])
      }

      let d = vectorLength(paMinusTba)

      if(d > max) max = d
      if(d < min) min = d

      for(let j=0; j<buckets.length; j++) {
        let val = j * 0.05
        if(d < val) {
          buckets[j].push(data[i])
          break
        }
      }
    }

    console.log(minDistance, maxDistance)

    for(let i=0; i<distances.length; i++) {
      // bottom left: 0 distance from both
      // y (row): distance from start
      // x (col): distance from end
      let coord = distances[i]
      let row = (coord[0] - minDistance) / (maxDistance - minDistance)

      for(let j=0; j<=1; j+=0.05) {
        let iterator = Math.round(j * (1/0.05))
        if(row < iterator * 0.05 || iterator == 19) {
          row = iterator
          break
        }
      }

      let col = (coord[1] - minDistance) / (maxDistance - minDistance)

      for(let j=0; j<=1; j+=0.05) {
        let iterator = Math.round(j * (1/0.05))
        if(col < iterator * 0.05 || iterator == 19) {
          col = iterator
          break
        }
      }

      densities[20 - row][col].push(coord[2])

      if(densities[row][col].length > maxDensity) maxDensity = densities[row][col].length
    }

    console.log(maxDensity)
    console.log(densities)

    let top10 = []
    for(let i=0; i<buckets.length; i++) {
      if(top10.length >= 10) break

      let iterator = 0
      while(top10.length < 10 && iterator < buckets[i].length) {
        let obj = buckets[i][iterator]
        let objMinusStart = []
        let endMinusObj = []

        for(let j=0; j<obj.encoding.length; j++) {
          objMinusStart.push(obj.encoding[j] - A[j])
          endMinusObj.push(B[j] - obj.encoding[j])
        }

        top10.push(Object.assign({
          startDistance: vectorLength(objMinusStart),
          endDistance: vectorLength(endMinusObj),
        }, obj))

        iterator++
      }
    }

    this.setState({
      intermediaries: top10,
      densities
    })
  }

  drawDensities() {
    let { densities } = this.state

    ctx.clearRect(0, 0, canvasRenderWidth, canvasRenderHeight)

    for(let row=0; row<densities.length; row++) {
      for(let col = 0; col<densities[row].length; col++) {
        ctx.fillStyle = `rgba(0, 0, 0, ${densities[row][col].length / maxDensity})`
        ctx.fillRect(col * cellDim, row * cellDim, cellDim, cellDim)
      }
    }
  }

  componentDidUpdate(prevProps, prevState) {
    let { startIndex, endIndex } = this.state
    if(startIndex !== prevState.startIndex || endIndex !== prevState.endIndex) {
      this.updateIntermediaries()
    }

    this.drawDensities()
  }

  userSelectTarget(id) {
    this.setState({
      endIndex: id,
      targetOptions: this.state.targetOptions.map(d => {
        if(d.index === id) {
          d.selected = true
        } else {
          d.selected = false
        }
        return d
      })
    })
  }

  clickCanvas(e) {
    let x = e.clientX, y = e.clientY
    let coordX = Math.round(size * (x - canvasXOffset) / canvasRenderWidth)
    let coordY = Math.round(size * (y - canvasYOffset) / canvasRenderHeight)

    if(coordX < 0 || coordY < 0 || coordX > size || coordY > size) return

    console.log(this.state.densities[coordY][coordX].slice(0, 10))
  }

  render({ data }, { startIndex, endIndex, intermediaries, targetOptions }) {
    return (
      <app>
        <div id="webgl-wrapper">
          <Dropdown change={this.userSelectTarget} options={targetOptions} />
          <div id="line">
            <div id="start">
              <div class="sentence">{data[startIndex].sentence}</div>
              <div class="marker"></div>
            </div>
            {intermediaries.map(d => {
              return <div style={`left:${100 * d.startDistance / (d.startDistance + d.endDistance)}%`} class="intermediary">
                <div class="sentence">{d.sentence}</div>
                <div class="marker"></div>
              </div>
            })}
            <div id="finish">
              <div class="sentence">{data[endIndex].sentence}</div>
              <div class="marker"></div>
            </div>
          </div>
          <div style={`width:${canvasRenderWidth}px;height:${canvasRenderHeight}px`} class="canvas-wrapper">
            <canvas onClick={this.clickCanvas} id="canvas"></canvas>
          </div>
        </div>
      </app>
    )
  }
}

Promise.all(Object.keys(preload).map(k => preload[k]())).then(() => {
  console.log(embeddings)
  render(<App data={embeddings} />, document.body)
})