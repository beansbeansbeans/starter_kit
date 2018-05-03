import { h, render, Component } from 'preact'
import Section from '../hoc/section'

let example = {
  'sentence': "all mixed up together like a term paper from a kid who can't quite distinguish one sci-fi work from another"
}

const cellMinOpacity = 0.15

class Introduction extends Component {
  componentWillMount() {
    let { data } = this.props

    let embedding = data[100].find(d => d.sentence.indexOf(example.sentence) > -1).encoding

    example.embedding = embedding.map(d => d.toFixed(3))
    example.embeddingSorted = embedding.sort((a, b) => a - b).reverse().map(d => d.toFixed(3))
    example.embeddingMax = Math.max(...embedding)
    example.embeddingMin = Math.min(...embedding)
  }

  render() {
    return (
      <div class="section-contents">
        <p>This is some background on the problem.</p>
        <p>Explain the point of the post, which is to demonstrate how different models / distance metrics hold up against our own intuitions about semantic distance.</p>
        <h3>Example</h3>
        <p>Here's where we can introduce the idea of an embedding and how we get from the raw embedding to the visual representation we'll be using in the post.</p>
        <p>Maybe here we want to list the models we'll be comparing. We can briefly describe each one - why people would prefer this model, some of its known drawbacks, etc.</p>
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
          <p>We can eventually import your code here for a live version, but wanted to use the video as a placeholder.</p>
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