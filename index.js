#!/usr/bin/env node

/**
 * Created by macno on 04/05/2017.
 */

const path = require('path');
const fs = require('fs');
const semver = require('semver');
const readline = require('readline');

const exec = require('child_process').exec;

const packtagPackageJson = require(path.resolve(__dirname, 'package.json'));

const program = require('commander');

const packageJsonPath = path.resolve(path.join(process.env.PWD, 'package.json'))

var version;
var packageJson;

program
    .version(packtagPackageJson.version)
    .option('-b, --bump', true)
    .option('--dry-run', true)
    .option('-f, --force', true)
    .option('-k, --skip-tag', true)
    .option('-i, --identifier <identifier>', 'prerelease identifier')
    .option('-m, --message <message>', 'Optional commit message')
    .option('-s, --silent', true)
    .option('-t, --type <type>', 'what to bump: major, premajor, minor, preminor, patch, prepatch or prerelease')
    .option('--verbose', true)
    .option('-v, --version', 'Packtag version')
    .option('-x, --set-version <version>', 'will bump to a specific version and ignore other flags')

    .parse(process.argv);

if (!program.bump && !program.setVersion) {
    program.outputHelp();
    process.exit();
}

const verbose = program.silent ? false : program.verbose

const updatePackageVersion = () => {
    if (!program.silent) {
        console.log('Bumping package.json to %s ..', version);
    }
    if (!program.dryRun) {
        packageJson.version = version;
        fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 3), 'utf8', function (err) {
            if (err) {
                console.error('Uops..', err)
                process.exit(10);
            }
            gitAddAndCommit()
        });
    } else {
        gitAddAndCommit()
    }
}

const gitTag = () => {
    if(program.skipTag) {
        return;
    }
    if (verbose) {
        console.log('Git tag ..')
    }
    if (!program.dryRun) {
        // tag..
        exec('git tag ' + version, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                process.exit(20);
            }
            if(verbose) {
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
            }
        })
    }
}

const gitAddAndCommit = () => {

    const message = program.message || packtagPackageJson.name + ' align ' + version;
    if (!program.dryRun) {
        if (verbose) {
            console.log('Git add ..')
        }
        exec('git add package.json', (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                process.exit(20);
            }
            if(verbose) {
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
            }


            if (verbose) {
                console.log('Git commit "' + message + '" ..')
            }
            exec('git commit -m "' + message + '"', (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    process.exit(21);
                }
                if(verbose) {
                    console.log(`stdout: ${stdout}`);
                    console.log(`stderr: ${stderr}`);
                }
                gitTag();
            })
        })
    } else {
        if (verbose) {
            console.log('Git add ..')
            console.log('Git commit "' + message + '" ..')
        }
        gitTag();
    }

}

const askToProceed = (rl) => {
    rl.question('Proceed? [y,yes,n,no] ', function (answer) {
        if (answer === 'y' || answer === 'yes') {
            updatePackageVersion()
            rl.close();
        } else if (answer == 'n' || answer === 'no') {
            rl.close();
            process.exit();
        } else {
            console.log('Invalid answer. Please type "y,yes,n,no')
            askToProceed(rl);
        }
    });
}

const setVersion = () => {
    const aligned = packageJson.version === version;
    if (!aligned) {
        if (semver.gt(packageJson.version, version)) {
            console.error("Package version greater then version! %s vs %s", packageJson.version, version);
            process.exit(5)
        }
        if (program.force) {
            if (verbose) {
                console.log('Package version mismatch: %s vs %s, aligning force', packageJson.version, version)
            }
            updatePackageVersion();
        } else {
            if (!program.silent) {
                console.log('Package version mismatch: %s vs %s', packageJson.version, version)
                const rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                askToProceed(rl)
            } else {
                process.exit(3)
            }
        }
    } else {
        gitTag();
    }
}

const run = () => {
    if (program.bump) {
        if (!program.type) {
            program.outputHelp();
            process.exit();
        }
        const identifier = program.identifier || ''
        version = semver.inc(packageJson.version, program.type, identifier);
        updatePackageVersion(gitTag);
    } else if (program.version) {
        version = program.setVersion;

        if (!semver.valid(version)) {
            if (!program.silent) {
                console.error('Invalid semver "%s"', version)
            }
            process.exit(1);
        }
        setVersion();
    }
}

try {
    packageJson = require(packageJsonPath);
    run();
} catch (e) {
    console.error('Can\'t find package.json');
}
