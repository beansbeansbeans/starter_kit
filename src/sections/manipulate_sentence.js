import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
const { bindAll } = helpers
import sharedState from '../sharedState'
import Section from '../hoc/section'

import PairWise from '../components/pairwise'
import Aggregation from '../components/aggregation'
import Permutations from '../components/permutations'
import Embeddings10D from '../components/embeddings10d'
import DistanceMatrix from '../components/distance_matrix'
import Spiral from '../components/embedding_spiral'
import ParallelCoordinates from '../components/parallelCoordinates'

class ManipulateSentence extends Component {
  render({ data }) {
    // let main = <DistanceMatrix data={data} />
    // let main = <Permutations data={data} />
    // let main = <Embeddings10D data={data} />
    // let main = <Aggregation data={data} />
    // let main = <PairWise data={data} />
    let main = <Spiral />
    // let main = <ParallelCoordinates data={data} />

    return (
      <div class="section-contents">
        <p>Investigation into individual sentence embeddings.</p>
        {main}
      </div>
    )
  }
}

ManipulateSentence = Section(ManipulateSentence)

export default ManipulateSentence