To copy over checkpoint:

    $ python3 scripts/dump_checkpoint_vars.py --model_type=tensorflow --output_dir=model/ --checkpoint_file=temp/model.ckpt-501424

Corrupt checkpoint variables: 

- 'logits/weights/Adam'
- 'logits/weights/Adam_1'
- 'word_embedding'

---

TASK: ATTEMPT TO PORT MODEL ARCHITECTURE, FIGURE OUT LATER HOW TO REHYDRATE CHECKPOINTS

`encoder.encode` (`encoder_manager.py:124`) is what actually feeds a datapoint through the architecture

How does the `SkipThoughtsEncoder` work?
- Initialized with word embeddings
- call `build_graph_from_config` which initializes the computation graph in `skip_thoughts_model.py`



---

MISC

from `models` repo, run `tensorboard --logdir=/tmp/skip_thoughts_logs` to visualize TensorBoard