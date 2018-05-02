import { h, render, Component } from 'preact'
import Section from '../hoc/section'

import DistanceMatrix from '../components/distance_matrix'

class MultipleSentences extends Component {
  componentWillMount() {

  }

  render({ data }) {
    return (
      <div class="section-contents">
        <p>Investigating a corpora of sentence embeddings.</p>
        <p>The point of the distance matrix visualization is to show how the clusters you'll find in your data depend greatly on the embedding model and the distance metric used. </p>
        <DistanceMatrix data={data} />
        <p>Now that we've seen how the clusters change, it would be great to discuss the tradeoffs between model / distance metric choices.</p>
        <p>E.g., if you use [insert model] under [insert distance metric], you'll tend to get clusters that have X quality. On the other hand, if you're looking for clusters with Y quality, you'd be better off using [insert model] under [insert distance metric].</p>
      </div>
    )
  }
}

MultipleSentences = Section(MultipleSentences)

export default MultipleSentences