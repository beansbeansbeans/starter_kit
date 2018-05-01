import { h, render, Component } from 'preact'
import helpers from './helpers/helpers'
const { roundDown, bindAll, removeDuplicates, wrapIterator, shuffle, subVectors, dotProduct, vectorLength, manhattanLength, permute } = helpers
import "../main.scss"
import { getData } from './api'
import { debounce, defer } from 'underscore'
import sharedState from './sharedState'
import mediator from './mediator'

// sections
import Introduction from './sections/introduction'
import ManipulateSentence from './sections/manipulate_sentence'
import MultipleSentences from './sections/multiple_sentences'

const preload = {
  getData: () => 
    Promise.all(['encodings_pca_100', 'encodings_pca_50', 'encodings_pca_10'].map(getData))
      .then(data => {
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
    return <dt-article class="dt-article">
      <div class="section">
        <div class="section-contents">
          <h1>Sentence Embeddings</h1>
        </div>
      </div>
      <Introduction data={data} title="Introduction" />
      <ManipulateSentence data={data} title="Manipulating Sentences" />
      <MultipleSentences data={data} title="Comparing Sentences" />
    </dt-article>
  }
}

Promise.all(Object.keys(preload).map(k => preload[k]())).then(() => {
  render(<App data={embeddings} />, document.body)
})