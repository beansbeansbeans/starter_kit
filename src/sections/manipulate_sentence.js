import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
const { bindAll } = helpers
import sharedState from '../sharedState'
import Section from '../hoc/section'

import PairWise from '../components/pairwise'
import Aggregation from '../components/aggregation'
import Permutations from '../components/permutations'
import Embeddings10D from '../components/embeddings10d'

import Spiral from '../components/embedding_spiral'
import ParallelCoordinates from '../components/parallelCoordinates'

class ManipulateSentence extends Component {
  render({ data }) {
    // let main = <DistanceMatrix data={data} />
    // let main = <Permutations data={data} />
    // let main = <Embeddings10D data={data} />
    // let main = <Aggregation data={data} />
    // let main = <PairWise data={data} />
    // let main = <ParallelCoordinates data={data} />

    return (
      <div class="section-contents">
        <p>Investigation into individual sentence embeddings.</p>
        <Spiral />
        <h3>Catalog of Insights</h3>
        <p>Here we could point out the things we figured out by comparing models / manipulations / sentences. Here's a pretend list to start with:</p>
        <ul>
          <li><p>Doc2Vec is overly sensitive to unusual words (see [insert sentence] under dropout manipulation)</p></li>
          <li><p>SkipThoughts very sensitive to last words (see [insert sentence] under forward manipulation)</p></li>
          <li><p>Certain models (like computational n-grams) under forward manipulation report opposite results for Euclidean vs. Wasserstein metrics.</p></li>
        </ul>
      </div>
    )
  }
}

ManipulateSentence = Section(ManipulateSentence)

export default ManipulateSentence