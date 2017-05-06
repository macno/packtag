# packtag

__Packtag__ helps you keeping _package.json_ version aligned with git tags.  

It works in 2 different ways:   
if __-x__ option is used, it checks the _package.json_ version, if it is aligned, then it just executes `git tag`. If the version mismatach, it updates it, commits it to git and then execute `git tag`

if __-b__ option is used, it reads the _package.json_ version, and then updates it using the __-t__ option.
Eventually it commits the changes and execute `git tag` 


## Usage

Install packtag globally

    npm install -g packtag

or add __packtag__ as dev-dependencies of your project

with _yarn_

    yarn add -D packtag

with _npm_

    npm install -D packtag

When you need to tag your repo, now just execute:

    
- if installed globally


    packtag -x 1.2.3
    
- if installed as project dependency


    node_modules/.bin/packtag -x 1.2.3

## Options

`packtag -x 1.2.3` it will set version to 1.2.3. If version is minor to the one found in package.json it will raise an error.


`packtag -b -type major` it will take current package.json version and bump the major version


more to come...
