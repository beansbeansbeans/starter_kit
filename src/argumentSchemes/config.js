const schemes = {
  "expertOpinion": {
    "label": "Expert Opinion",
    "premises": [
      "Source {{E}} is an expert in subject domain {{S}} containing proposition {{A}}",
      "{{E}} asserts that proposition {{A}} is {{B}}."
    ],
    "conclusion": "Conclusion: {{A}} is {{B}}",
    "critical_questions": [
      { "data": "How credible is {{E}} as an expert source?" },
      { "data": "Is {{E}} an expert in the field that {{A}} is in?" },
      { "data": "What did {{E}} assert that implies {{A}}?" },
      { "data": "Is {{E}} personally reliable as a source?" },
      { "data": "Is {{A}} consistent with what other experts assert?" },
      { "data": "Is {{E}}'s assertion based on evidence?" }
    ]
  },
  "popularOpinion": {
    "label": "Popular Opinion",
    "premises": [
      "{{A}} is generally accepted as true.",
      "If {{A}} is generally accepted as true, that gives a reason in favor of {{A}}."
    ],
    "conclusion": "There is a reason in favor of {{A}}.",
    "critical_questions": [
      { "data": "What evidence supports that {{A}} is generally accepted as true?" },
      { "data": "Even if {{A}} is generally accepted as true, are there any good reasons for doubting that it is true?" }
    ]
  },
  "example": {
    "label": "Example",
    "walton_id": 6,
    "premises": [
      "In this particular case, the individual {{A}} has property {{F}} and property {[G}}."
    ],
    "conclusion": "Therefore, generally, if {{X}} has property {{F}}, then it also has property {{G}}.",
    "critical_questions": [
      { "data": "Is the premise in fact true?" },
      { "data": "Does the example cited support the generalization it is supposed to be an instance of?" },
      { "data": "Is the example typical of the kinds of cases the generalization covers?" },
      { "data": "How strong is the generalization?" },
      { "data": "Do special circumstances of the example impair its generalizability?" }
    ]
  },
  "analogy": {
    "label": "Analogy",
    "walton_id": 7,
    "premises": [
      "Generally, case {{C1}} is similar to case {{C2}}.",
      "{{A}} is {{B}} in case {{C1}}."
    ],
    "conclusion": "{{A}} is {{B}} in case {{C2}}.",
    "critical_questions": [
      { "data": "Are there differences between {{C1}} and {{C2}} that would tend to undermine the force of the similarity cited?" },
      { "data": "Is {{A}} {{B}} in {{C1}}?" },
      { "data": "Is there some other case {{C3}} that is also similar to {{C1}}, but in which {{A}} is not {{B}}?"}
    ]
  },
  "composition": {
    "label": "Composition",
    "walton_id": 9,
    "premises": [
      "All the parts of {{X}} have property {{Y}}."
    ],
    "conclusion": "Therefore, {{X}} has property {{Y}}.",
    "critical_questions": [
      { "data": "Is property {{Y}} compositionally hereditary with regard to aggregate {{X}}?" }
    ]
  }
}

export default schemes