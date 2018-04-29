import { h, render, Component } from 'preact'
import Section from '../hoc/section'

let example = {
  'sentence': "all mixed up together like a term paper from a kid who can't quite distinguish one sci-fi work from another"
}

class Introduction extends Component {
  componentWillMount() {
    let { data } = this.props
    console.log(data)

    example.embedding = data[100].find(d => d.sentence.indexOf(example.sentence) > -1).encoding.map(d => d.toFixed(2))
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
          <div>{example.embedding.join(", ")}</div>
        </figure>
      </div>
    )
  }
}

Introduction = Section(Introduction)

export default Introduction