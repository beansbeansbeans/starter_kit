import { h, render, Component } from 'preact'
import Section from '../hoc/section'
import SentencesVsFeaturesMatrix from '../components/sentences_vs_features_matrix'

class SentencesVsFeatures extends Component {
  componentWillMount() {
  }

  render() {
    return (
      <div class="section-contents">
        <p>Try to see whether we can use this visualization to assign meaning to any features.</p>
        <SentencesVsFeaturesMatrix />
        <p>What did we learn? Anything?</p>
      </div>
    )
  }
}

SentencesVsFeatures = Section(SentencesVsFeatures)

export default SentencesVsFeatures