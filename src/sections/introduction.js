import { h, render, Component } from 'preact'
import Section from '../hoc/section'

let example = {
  'sentence': "all mixed up together like a term paper from a kid who can't quite distinguish one sci-fi work from another"
}

const cellMinOpacity = 0.15

class Introduction extends Component {
  componentWillMount() {
    let { data } = this.props
    console.log(data)

    let embedding = data[100].find(d => d.sentence.indexOf(example.sentence) > -1).encoding

    example.embedding = embedding.map(d => d.toFixed(3))
    example.embeddingSorted = embedding.sort((a, b) => a - b).reverse().map(d => d.toFixed(3))
    example.embeddingMax = Math.max(...embedding)
    example.embeddingMin = Math.min(...embedding)

    console.log(example.embeddingMax)
    console.log(example.embeddingMin)
  }

  render() {
    return (
      <div class="section-contents">
        <p>This is some background on what sentence embeddings are.</p>
        <h3>Example</h3>
        <figure>
          <h4>Sentence:</h4>
          <p class="sentence">{`“${example.sentence}”`}</p>
          <h4>Embedding:</h4>
          <h5>STEP 0: Raw</h5>
          <div class="vector">{example.embedding.join(", ")}</div>
          <h5>STEP 1: Sorted</h5>
          <div class="vector">{example.embeddingSorted.join(", ")}</div>
          <h5>STEP 2: Colored</h5>
          <div class="vector">{example.embeddingSorted.map(d => <div class="cell" style={`background: rgba(123, 43, 20, ${((d - example.embeddingMin) / (example.embeddingMax - example.embeddingMin))})`}></div>)}</div>
          <h5>STEP 3: Spiralized</h5>
          <video width="240" height="240" autoplay loop>
            <source src="videos/spiral_emb.mp4" type="video/mp4" />
          </video>
        </figure>
      </div>
    )
  }
}

Introduction = Section(Introduction)

export default Introduction