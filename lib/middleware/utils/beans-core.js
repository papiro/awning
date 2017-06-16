'use strict'

const
  util = require('util'),
  debug = util.debuglog('awning.beans')
,
  delimiter = '`',
  beanMatcher = new RegExp(`(?:[^\\\\])${delimiter}([\\s\\S]*?[^\\\\])${delimiter}`, 'g')
;

class Bean {
  constructor (bean) {
    this.stringBean = bean
  }
  compile () {
    debug('compiling ', this.stringBean)

    // extract the expression
    const [ exp, markup ] = this.stringBean.split(/=>/)
    debug('expression:::', exp)
    debug('markup:::', markup)

    this.tpl = (context) => {
      // interpolate
      return markup.replace(/\$\{.*\}/, (match) => {
        // parse the interpolation key
        const key = match.match(/(?:\$\{)(.*)(?:\})/)[1]
        debug('replacing ', match, ' with ', context[key])
        return context[key]
      })
    }

    if (exp[0] === '[') {
      debug('bean expression is an array literal')
      debug('simplifying bean...')
      const [ context, varName ] = exp.split('as').map( s => s.trim() )
      this.tpl = () => this.tpl(
        varName ?
          { [varName]: context } :
          { this: context }
      )
    }
  }
  evaluate (context) {
    // if using evaluate straight-away as a shortcut method
    if (!this.tpl) {
      this.compile()
    }
    return this.tpl(context)
  }
}

exports.Beans = class Beans {
  constructor (str) {
    debug('extracting beans from ', str.slice(0, 100)+'...')
    
    const entries = []
    let match

    while ((match = beanMatcher.exec(str)) !== null) {
      debug('found match:::', match[1])
      
      // grab any text before the match
      const temp = str.slice(0, match.index)
      
      if (temp) {
        debug('found a non-bean:::', temp)        
        entries.push(temp)
      }

      // gradually whittle the str down to make our exec faster
      str = str.slice(match.index + match[0].length + 1)
      debug('whittled down string to:::', str)
      
      entries.push(new Bean(match[1]))
    }
  
    // if there's no beans, just use the str by itself
    if (!entries.length) entries.push(str)

    Object.assign(this, entries, { 
      length: entries.length,
      entries
    })
  }

  evaluate (context) {
    return this.entries.map( beansEntry => {
      return beansEntry instanceof Bean ? beansEntry.evaluate(context) : beansEntry
    }).join('')
  }
}
