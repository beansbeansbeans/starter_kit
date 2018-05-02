import { h, render, Component } from 'preact'
import Section from '../hoc/section'

import DistanceMatrix from '../components/distance_matrix'

class MultipleSentences extends Component {
  componentWillMount() {

  }

  render({ data }) {
    return (
      <div class="section-contents">
        <p>Investigation into a corpora of sentence embeddings.</p>
        <DistanceMatrix data={data} />
      </div>
    )
  }
}

MultipleSentences = Section(MultipleSentences)

export default MultipleSentences