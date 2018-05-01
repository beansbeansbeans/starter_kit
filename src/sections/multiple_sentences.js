import { h, render, Component } from 'preact'
import Section from '../hoc/section'

class MultipleSentences extends Component {
  componentWillMount() {
    let { data } = this.props
  }

  render() {
    return (
      <div class="section-contents">
        <p>Investigation into a corpora of sentence embeddings.</p>
      </div>
    )
  }
}

MultipleSentences = Section(MultipleSentences)

export default MultipleSentences