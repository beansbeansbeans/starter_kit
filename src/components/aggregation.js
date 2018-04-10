import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
const { roundDown, bindAll, removeDuplicates, wrapIterator, shuffle, subVectors, dotProduct, vectorLength, manhattanLength, permute } = helpers
import randomModule from '../helpers/random'
const random = randomModule.random(42)

class Aggregation extends Component {
  state = {

  }

  componentWillMount() {
    bindAll(this, [])
  }

  componentDidMount() {
    let sample = this.props.data['10']
    console.log("data length", this.props.data['10'].length)
    console.log(sample)

    function Node(obj, dimension, parent) {
      this.obj = obj
      this.left = null
      this.right = null
      this.parent = parent
      this.dimension = dimension
    }

    let dimensions = sample[0].encoding.length

    function buildTree(points, depth, parent) {
      let dim = depth % dimensions, median, node

      if(!points.length) return null

      if(points.length === 1) {
        return new Node(points[0], dim, parent)
      }

      points.sort(function(a, b) {
        return a[dim] - b[dim]
      })

      median = Math.floor(points.length / 2)
      node = new Node(points[median], dim, parent)
      node.left = buildTree(points.slice(0, median), depth + 1, node)
      node.right = buildTree(points.slice(median + 1), depth + 1, node)

      return node
    }

    console.time("kdTree")
    let kdTree = buildTree(sample, 0, null)
    console.timeEnd("kdTree")

    console.log(kdTree)
  }

  render() {
    return (
      <div id="aggregation-wrapper">
        lol
      </div>
    )
  }
}

export default Aggregation