import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
const { bindAll } = helpers
import sharedState from '../sharedState'
import Section from '../hoc/section'

class ManipulateSentence extends Component {
  render() {
    return (
      <p>Investigation into individual sentence embeddings.</p>
    )
  }
}

ManipulateSentence = Section(ManipulateSentence)

export default ManipulateSentence