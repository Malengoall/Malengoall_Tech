const chalk = require('chalk')

const color = (text, color) => {
    return !color ? chalk.blue(text) : chalk.keyword(color)(text)
}

const bgcolor = (text, bgcolor) => {
  return !bgcolor ? chalk.blue(text) : chalk.bgKeyword(bgcolor)(text)
}

const Lognyong = (text, color) => {
  return !color ? chalk.red('[ ! ] ') + chalk.blue(text) : chalk.red('=> ') + chalk.keyword(color)(text)
}

module.exports = {
  color,
  bgcolor,
  Lognyong
}
