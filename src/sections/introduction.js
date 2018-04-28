import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
const { bindAll } = helpers
import sharedState from '../sharedState'
import Section from '../hoc/section'

class Introduction extends Component {
  render() {
    return (
      <p>This is some background on what sentence embeddings are.</p>
    )
  }
}

Introduction = Section(Introduction)

export default Introduction