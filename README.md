
# Language Server Tutorial Code

This repository contains the source code you need to fork to follow the tutorial
available at https://madbrain.github.io/kale-language-handson/

At each step in the tutorial, merge the tag `step-x.y` to initialize the corresponding step. Start with the command:
```
git checkout -b tutorial
git merge step-1.1
```

Then execute:
```
npm install
npm test
```

Complete the code until all tests are green, then merge next step.

If stuck, solutions are available at tags corresponding to each step, ie. at step `step-x.y` consult tag `solution-step-x.y`.