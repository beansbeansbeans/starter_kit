MVP

- Have the computer draw from this store when taking its turns. At this point pretend that the store is fixed. 
- Have the user's attacks / defenses conform to this store

the tree nodes need to all point to the argument elements
- don't import the entire node objects, rather just the id's, and stuff them in the extraData field
- when it's the computer's turn to attack an argument, look for attackers in the store. 

basically, every time the computer or the human lodges an argument, it needs to either fit in the store, or not. (if it doesn't fit in the store, then the computer can't respond to it)

I feel like... to approach this rigorously, I need to graft Walton's formalisms onto some sort of dialogue protocol - some sort of formalism that will help me assemble this argument tree. 

I feel like right now I have it kind of backwards... I'm using Walton's formalisms to construct the argument framework. Really, Walton's formalisms / schemes are a way to decorate the components of an argument framework, which might be better built using something like ASPIC.


- Build infrastructure for storing actual argument data

I think this is just going to be in the form of a JSON object, that I traverse and convert into a tree structure, much like I do in processArgument.js


- Come up with a script that navigates through the fixed dataset that we'll have


Critical questions vs other arguments:

I don't think it's possible to collapse the notions of critical questions and other arguments. 

You can either raise the question, which forces the proponent to provide explanation, or you can raise the question with a challenge, which forces the proponent to defend. 

Maybe, for now we assume that you can only challenge, you can't simply raise questions. 