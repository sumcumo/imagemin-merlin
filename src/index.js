const rimraf = require('rimraf')
const sgf = require('staged-git-files')
const utils = require('./utils.js')
const cwd = require('cwd')
const globby  = require('globby')

// files to be crushed
const fileTypes = ['gif', 'jpg', 'jpeg', 'png']
console.log(`(Search pattern: ${fileTypes.join(', ')})\n`)

let savedKB = 0

module.exports = async argv => {
  if(argv.dry){
    rimraf.sync('/tmp/imagemin-merlin')
  }

  const patterns = getFilePattern(argv.ignore)
  let files = findFiles(patterns)
  let crushFiles = files

  // search for staged files
  if(argv.staged){
    sgf('A', async function(err, results){
      if(err){
        return console.error(err)
      }

      crushFiles = results
        .map(result => result.filename)
        .filter(filename => files.includes(filename))

      crush(crushFiles, argv.dry)
    })
  } else {
    crush(crushFiles, argv.dry)
  }
}

const closingNote = (didRun) => {
  if(didRun){
    console.info(`\n🎉 You saved ${utils.sizeHuman(savedKB)}.`)
  } else {
    console.info('\nThere were no images found to crush ¯\\_(ツ)_/¯ See you next time.')
  }
}

const crush = async (files, dry) => {
  for (let index = 0; index < files.length; index++) {
    const file = files[index]
    savedKB += await utils.crushing(file, dry)
  }

  const didRun = files.length > 0
  closingNote(didRun)
}

const getFilePattern = (ignore) => {
  const patterns = []

  fileTypes.forEach((fileType) => {
    patterns.push(`**/*.${fileType}`)
  })

  if(ignore){
    const ignorePaths = ignore.split(',')
    ignorePaths.forEach((path) => {
      patterns.push(`!${path}`)
    })
  }

  return patterns
}

const findFiles = (patterns, options = {}) => {
  return globby.sync(patterns, { gitignore: true, ...options })
}
