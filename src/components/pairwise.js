import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
const { roundDown, bindAll, removeDuplicates, wrapIterator, shuffle, subVectors, dotProduct, vectorLength, manhattanLength, permute } = helpers
import randomModule from '../helpers/random'
const random = randomModule.random(42)
import { getData, getShader } from '../api'

const size = 20

let increment = 1/size

let canvasRenderWidth, canvasRenderHeight, canvas, ctx, maxDensity, cellDim, canvasXOffset, canvasYOffset, minDistance = 0, maxDistance = 0

const getDistance = {
  'euclidean': vectorLength,
  'manhattan': manhattanLength,
  'wasserstein': function(vec, startIndex, endIndex, dim) {
    return wassersteinPairwise[dim][startIndex][endIndex]
  }
}

let sentenceDict = {}
let wassersteinPairwise = {
  10: {}, 50: {}, 100: {}
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
            selected={d.selected} class="option">{d.sentence ? d.sentence : d.index}</option>
        })}
      </select>
    )
  }
}

class PairWise extends Component {
  state = { 
    startIndex: 0,
    endIndex: 0,
    targetOptions: [],
    startOptions: [],
    intermediaries: [],
    densities: [],
    distanceTypes: [
      {
        index: 'euclidean',
        selected: true
      },
      {
        index: 'manhattan',
        selected: false
      },
      {
        index: 'wasserstein',
        selected: false
      }
    ],
    dimensions: [
      {
        index: 100,
        selected: true
      },
      {
        index: 50,
        selected: false
      },
      {
        index: 10,
        selected: false
      }
    ]
  }

  componentWillMount() {
    bindAll(this, ['updateIntermediaries', 'drawDensities', 'userSelectTarget', 'clickCanvas'])

    Promise.all(['sentence_to_index', 'pairwise_wasserstein_10', 'pairwise_wasserstein_50', 'pairwise_wasserstein_100'].map(getData)).then(resp => {
      sentenceDict = resp[0]
      wassersteinPairwise['10'] = resp[1]
      wassersteinPairwise['50'] = resp[2]
      wassersteinPairwise['100'] = resp[3]
    })
  }

  componentDidMount() {
    let starts = [
      "there's nothing remotely topical or sexy here",
      "simplistic , silly and tedious",
      "grant carries the day with impeccable comic timing",
      'an engrossing iranian film'
    ]

    let targets = [
      'lan yu is a genuine love story , full of traditional layers of awakening and ripening and separation and recovery',
      "all mixed up together like a term paper from a kid who can't quite distinguish one sci-fi work from another",
      'a tour de force of modern cinema',
      'banal and predictable',
      'i liked it just enough'
    ]

    let data = this.props.data[this.state.dimensions.find(d => d.selected).index]

    let startIndices = starts.map(d => data.findIndex(obj => obj.sentence.indexOf(d) > -1))
    let targetIndices = targets.map(d => data.findIndex(obj => obj.sentence.indexOf(d) > -1))

    let startIndex = startIndices[0]
    let targetIndex = targetIndices[0]

    const getOption = (d, i) => ({
      index: d,
      sentence: data[d].sentence,
      selected: i === 0
    })

    this.setState({
      startIndex,
      endIndex: targetIndex,
      startOptions: startIndices.map(getOption),
      targetOptions: targetIndices.map(getOption)
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
    let { startIndex, endIndex, distanceTypes, dimensions } = this.state
    let distance = distanceTypes.find(d => d.selected).index
    let numDimensions = dimensions.find(d => d.selected).index

    let min = Infinity, max = 0
    let distances = []
    let buckets = []
    let densities = []

    minDistance = Infinity
    maxDistance = 0
    maxDensity = 0

    data = data[numDimensions]

    let A = data[startIndex].encoding
    let B = data[endIndex].encoding
    let Aindex = sentenceDict[data[startIndex].sentence]
    let Bindex = sentenceDict[data[endIndex].sentence]

    for(let i=0; i<1; i+=increment) {
      buckets.push([])
      densities.push([])
      for(let j=0; j<1; j+=increment) densities[densities.length - 1].push([])
    }

    for(let i=0; i<data.length; i++) {
      if(i == startIndex || i == endIndex) continue

      let P = data[i].encoding
      let Pindex = sentenceDict[data[i].sentence]
      let pa = subVectors(P, A)
      let ba = subVectors(B, A)
      let bp = subVectors(B, P)
      let t = dotProduct(pa, ba) / dotProduct(ba, ba)
      let startDistance = getDistance[distance](pa, Aindex, Pindex, numDimensions)
      let endDistance = getDistance[distance](bp, Bindex, Pindex, numDimensions)

      distances.push([startDistance, endDistance, data[i].sentence])

      if(startDistance < minDistance) minDistance = startDistance
      if(endDistance < minDistance) minDistance = endDistance
      if(startDistance > maxDistance) maxDistance = startDistance
      if(endDistance > maxDistance) maxDistance = endDistance

      let tba = []
      for(let j=0; j<ba.length; j++) tba.push(t * ba[j])

      let paMinusTba = []
      for(let j=0; j<pa.length; j++) paMinusTba.push(pa[j] - tba[j])

      let d = vectorLength(paMinusTba)

      if(d > max) max = d
      if(d < min) min = d

      for(let j=0; j<buckets.length; j++) {
        let val = j * increment
        if(d < val) {
          buckets[j].push(data[i])
          break
        }
      }
    }

    for(let i=0; i<distances.length; i++) {
      // bottom left: 0 distance from both
      // y (row): distance from start
      // x (col): distance from end
      let coord = distances[i]
      let row = (coord[0] - minDistance) / (maxDistance - minDistance)

      for(let j=0; j<=1; j+=increment) {
        let iterator = Math.round(j * size)
        if(row < iterator * increment || iterator == size - 1) {
          row = iterator
          break
        }
      }

      let col = (coord[1] - minDistance) / (maxDistance - minDistance)

      for(let j=0; j<=1; j+=increment) {
        let iterator = Math.round(j * size)
        if(col < iterator * increment || iterator == size - 1) {
          col = iterator
          break
        }
      }

      densities[size - row][col].push(coord[2])

      if(densities[row][col].length > maxDensity) maxDensity = densities[row][col].length
    }

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
          distanceFromLine: i * increment
        }, obj))

        iterator++
      }
    }

    this.setState({
      intermediaries: top10,
      densities
    }, this.drawDensities)
  }

  drawDensities() {
    let { densities } = this.state

    ctx.clearRect(0, 0, canvasRenderWidth, canvasRenderHeight)

    for(let row=0; row<densities.length; row++) {
      for(let col = 0; col<densities[row].length; col++) {
        if(densities[row][col].length) {
          ctx.fillStyle = `rgba(0, 0, 0, ${0.05 + 0.95 * (densities[row][col].length / maxDensity)})`
        } else {
          ctx.fillStyle = `rgba(0, 0, 0, 0)`
        }
        ctx.fillRect(col * cellDim, row * cellDim, cellDim, cellDim)
      }
    }
  }

  componentDidUpdate(prevProps, prevState) {
    let { startIndex, endIndex, distanceTypes } = this.state

    if(startIndex !== prevState.startIndex || endIndex !== prevState.endIndex) {
      this.updateIntermediaries()
    }
  }

  userSelectTarget(id, side) {
    let options = 'targetOptions'
    if(side === 'startIndex') options = 'startOptions'

    this.setState({
      [side]: id,
      [options]: this.state[options].map(d => {
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
    let coordX = Math.floor(size * (x - canvasXOffset) / canvasRenderWidth)
    let coordY = Math.floor(size * (y - canvasYOffset) / canvasRenderHeight)

    if(coordX < 0 || coordY < 0 || coordX > size || coordY > size) return

    console.log(this.state.densities[coordY][coordX].slice(0, 10))
  }

  render({ data }, { startIndex, endIndex, intermediaries, targetOptions, startOptions, distanceTypes, dimensions }) {
    let numDimensions = dimensions.find(d => d.selected).index
    data = data[numDimensions]

    return (
      <div id="pairwise">
        <div class="dropdown-wrapper">
          <div>start:</div>
          <Dropdown change={id => this.userSelectTarget(id, 'startIndex')} options={startOptions} />
        </div>
        <div class="dropdown-wrapper">
          <div>end:</div>
          <Dropdown change={id => this.userSelectTarget(id, 'endIndex')} options={targetOptions} />
        </div>
        <div id="line">
          <div id="start">
            <div class="sentence">{data[startIndex].sentence}</div>
            <div class="marker"></div>
          </div>
          {intermediaries.map(d => {
            return <div style={`left:${100 * d.startDistance / (d.startDistance + d.endDistance)}%`} class="intermediary">
              <div class="sentence">{`${d.sentence} (${d.distanceFromLine.toFixed(2)})`}</div>
              <div class="marker"></div>
            </div>
          })}
          <div id="finish">
            <div class="sentence">{`${data[endIndex].sentence}`}</div>
            <div class="marker"></div>
          </div>
        </div>
        <div style={`width:${canvasRenderWidth}px;height:${canvasRenderHeight}px`} class="canvas-wrapper">
          <canvas onClick={this.clickCanvas} id="canvas"></canvas>
        </div>
        <div style={`width:${canvasRenderWidth}px;`} class="distances">
          {`min distance: ${minDistance.toFixed(3)} | max distance: ${maxDistance.toFixed(3)}`}
          <Dropdown change={d => {
            this.setState({
              distanceTypes: distanceTypes.map(type => {
                if(type.index === d) {
                  type.selected = true
                } else {
                  type.selected = false
                }
                return type
              })
            }, this.updateIntermediaries)
          }} options={distanceTypes} />
          <Dropdown change={d => {
            this.setState({
              dimensions: dimensions.map(type => {
                if(type.index == d) {
                  type.selected = true
                } else {
                  type.selected = false
                }
                return type
              })
            }, this.updateIntermediaries)
          }} options={dimensions} />
        </div>
      </div>
    )
  }
}

export default PairWise