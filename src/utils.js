const filesize = require('filesize')
const fs = require('fs')
const parsePath = require('parse-filepath')
const imagemin = require('imagemin')
const imageminJpegtran = require('imagemin-jpegtran')
const imageminOptipng = require('imagemin-optipng')
const imageminGifsicle = require('imagemin-gifsicle')
const chalk = require('chalk')
const options = require('./plugin_options.js')

const crushing = async (filename, dry) => {
  const filenameBackup = `${filename}.bak`
  fs.copyFileSync(filename, filenameBackup)

  const fileSizeBefore = size(filename)

  if(fileSizeBefore === 0){
    console.info(chalk.blue(`Skipping ${filename}, it has ${filesize(fileSizeBefore)}`))
    return
  }

  let output = parsePath(filename).dir || './'
  if(dry){
    output = `/tmp/imagemin-merlin/${parsePath(filename).absolute}`
  }

  await imagemin([filename], output, {
    plugins: [
      imageminJpegtran(options.jpegtran),
      imageminOptipng(options.optipng),
      imageminGifsicle(options.gifsicle),
    ]
  })
  const fileSizeAfter = size(`${output}/${parsePath(filename).base}`)

  let color = 'white'
  let status = 'Skipped'
  let details = 'already optimized'

  if(fileSizeAfter < fileSizeBefore){
    color = 'green'
    status = 'Crushed'
    details = `${sizeHuman(fileSizeBefore)} → ${sizeHuman(fileSizeAfter)}`
  } else if(fileSizeAfter > fileSizeBefore){ // filesize is bigger than before
    color = 'blue'
    status = 'Skipped'
    details = 'more optimized'

    // restore the backup'ed file
    fs.renameSync(filenameBackup, filename)
  }

  if(fs.existsSync(filenameBackup)){
    fs.unlinkSync(filenameBackup)
  }

  console.info(
    chalk[color](
      `${status} ${filename} (${details})`
    )
  )

  if(fileSizeAfter === 0){
    console.error(chalk.bold.red(`Something went wrong, new filesize is ${filesize(fileSizeAfter)}`))
  }

  return fileSizeAfter < fileSizeBefore ? fileSizeBefore - fileSizeAfter : 0
}

const size = (file) => {
  return fs.statSync(file)['size']
}

const sizeHuman = (size) => {
  return filesize(size, { round: 5 })
}

module.exports = {
  crushing,
  sizeHuman,
}
