import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
const { roundDown, bindAll, removeDuplicates, wrapIterator, shuffle, subVectors, dotProduct, vectorLength, manhattanLength, permute, fractional } = helpers
import { encodings } from '../config'
import randomModule from '../helpers/random'
const random = randomModule.random(42)

class Dropdown extends Component {
  render({ options, change }) {
    return (
      <select onChange={e => change(e.target.value)} class="options">
        {options.map(d => {
          return <option 
            value={d.id}
            selected={d.active} class="option">{d.sentence}</option>
        })}
      </select>
    )
  }
}

class Permutations extends Component {
  constructor(props) {
    super(props)

    let sentences = [
      "i'm going to give it a marginal thumbs up. i liked it just enough .",
      "a deliciously nonsensical comedy about a city coming apart at its seams ."
    ]

    this.setState({
      sets: sentences.map((d, i) => {
        return {
          sentence: d,
          active: i === 0,
          id: i
        }
      })
    })
  }

  componentWillMount() {
    console.log(encodings)

    bindAll(this, ['changeSentence'])
  }

  changeSentence(id) {
    this.setState({
      sets: this.state.sets.map(d => {
        if(d.id == id) {
          d.active = true
        } else {
          d.active = false
        }

        return d
      })
    })
  }

  render({}, { sets }) {
    let activeSentence = sets.find(d => d.active)

    console.log(activeSentence)

    return (
      <div id="permutations">
        <Dropdown change={id => this.changeSentence(id)} options={sets} />
      </div>
    )
  }
}

export default Permutations