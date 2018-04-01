To copy over checkpoint:

    $ python3 scripts/dump_checkpoint_vars.py --model_type=tensorflow --output_dir=model/ --checkpoint_file=temp/model.ckpt-501424

Corrupt checkpoint variables: 

- 'logits/weights/Adam'
- 'logits/weights/Adam_1'
- 'word_embedding'