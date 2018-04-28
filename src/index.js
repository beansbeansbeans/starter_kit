import { h, render, Component } from 'preact'
import helpers from './helpers/helpers'
const { roundDown, bindAll, removeDuplicates, wrapIterator, shuffle, subVectors, dotProduct, vectorLength, manhattanLength, permute } = helpers
import "../main.scss"
import { getData } from './api'
import { debounce, defer } from 'underscore'
import sharedState from './sharedState'
import mediator from './mediator'
import { handleResize } from './listeners'
import PairWise from './components/pairwise'
import Aggregation from './components/aggregation'
import Permutations from './components/permutations'
import Embeddings10D from './components/embeddings10d'
import DistanceMatrix from './components/distance_matrix'
import Spiral from './components/embedding_spiral'
import ParallelCoordinates from './components/parallelCoordinates'

// sections
import Introduction from './sections/introduction'
import ManipulateSentence from './sections/manipulate_sentence'

const preload = {
  getData: () => 
    Promise.all(['encodings_pca_100', 'encodings_pca_50', 'encodings_pca_10'].map(getData))
      .then(data => {
        console.log(data)
        let indices = []
        for(let i=0; i<data[0].length; i++) indices.push(i)
        indices = shuffle(indices)

        embeddings = {
          100: permute(data[0], indices),
          50: permute(data[1], indices),
          10: permute(data[2], indices)
        }
      })
  }

class App extends Component {
  render({ data }) {
    // let main = <DistanceMatrix data={data} />
    // let main = <Permutations data={data} />
    // let main = <Embeddings10D data={data} />
    // let main = <Aggregation data={data} />
    // let main = <PairWise data={data} />
    let main = <Spiral />
    // let main = <ParallelCoordinates data={data} />

    return <dt-article class="dt-article">
      <h1>Sentence Embeddings</h1>
      <Introduction title="Introduction" />
      <ManipulateSentence title="Manipulating sentences" />
      {main}
    </dt-article>
  }
}

Promise.all(Object.keys(preload).map(k => preload[k]())).then(() => {
  render(<App data={embeddings} />, document.body)
})