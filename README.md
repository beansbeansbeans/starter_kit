MVP

- DONE - Implement 5 argument schemes, where critical questions of each are also argument schemes.
- DONE - On page load, generate a web of ~40 nodes that relate to each other via these argument schemes
- Have the computer draw from this store when taking its turns. At this point pretend that the store is fixed. 

the tree nodes need to all point to the argument elements
- don't import the entire node objects, rather just the id's, and stuff them in the extraData field
- when it's the computer's turn to attack an argument, look for attackers in the store. 

basically, every time the computer or the human lodges an argument, it needs to either fit in the store, or not. (if it doesn't fit in the store, then the computer can't respond to it)


- Have the user's attacks / defenses conform to this store
- build infrastructure for storing actual argument data


I don't think it's possible to collapse the notions of critical questions and other arguments. 

You can either raise the question, which forces the proponent to provide explanation, or you can raise the question with a challenge, which forces the proponent to defend. 

Maybe, for now we assume that you can only challenge, you can't simply raise questions. 