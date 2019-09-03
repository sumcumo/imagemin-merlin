const rimraf = require('rimraf')
const find = require('find')
const sgf = require('staged-git-files')
const utils = require('./utils.js')
const cwd = require('cwd')

// files to be crushed
const regex = new RegExp(/\.gif|\.jpeg|\.jpg|\.png$/)
console.log(`(Search pattern: ${regex})\n`)

let savedKB = 0

module.exports = async argv => {
  if(argv.dry){
    rimraf.sync('/tmp/imagemin-merlin')
  }

  let ignorePaths = []

  if(argv.ignore){
    ignorePaths = argv.ignore.split(',')
  }

  // search for staged files
  if(argv.staged){
    sgf('A', async function(err, results){
      if(err){
        return console.error(err)
      }

      let didRun = false

      let filteredResults = results
        .filter(result => result.filename.match(regex))

      ignorePaths.forEach(ignorePath => {
        filteredResults = filteredResults
          .filter(result => !result.filename.match(new RegExp(ignorePath)))
      })

      for (let index = 0; index < filteredResults.length; index++) {
        const result = filteredResults[index];
        didRun = true
        savedKB += await utils.crushing(result.filename, argv.dry)
      }

      closingNote(didRun)
    })
  } else {
    let folder = cwd()

    if(argv.folder){
      folder = argv.folder
    }

    let files = find.fileSync(regex, folder)
    let didRun = false

    ignorePaths.forEach(ignorePath => {
      files = files
        .filter(file => !file.match(new RegExp(ignorePath)))
    })

    for (let index = 0; index < files.length; index++) {
      const file = files[index]

      if(!file.match(/node_modules\//)){
        didRun = true
        savedKB += await utils.crushing(file, argv.dry)
      }
    }

    closingNote(didRun)
  }
}

const closingNote = (didRun) => {
  if(didRun){
    console.info(`\n🎉 You saved ${utils.sizeHuman(savedKB)}.`)
  } else {
    console.info('\nThere were no images found to crush ¯\\_(ツ)_/¯ See you next time.')
  }
}
