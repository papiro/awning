'use strict'

const
  util = require('util'),
  debug = util.debuglog('awning.beans')
,
  delimiter = '`',
  regex = {
    quotes: /^['"]|['"]$/g,
    interpoloation: /\$\{.*\}/g,
    interpoloation_stripped: /(?:\$\{)(.*)(?:\})/g,
    beanMatcher: new RegExp(`(?:[^\\\\])${delimiter}([\\s\\S]*?[^\\\\])${delimiter}`, 'g')    
  }
;


class Bean {
  constructor (bean) {
    // extract the expression
    const [ exp, markup ] = bean.split(/=>/).map( s => s.trim() ) // this trim keeps the beanMatcher regex from becoming ungainly
    debug('expression:::', exp)
    debug('markup:::', markup)

    // make these available on the instance
    Object.assign(this, { 
      stringBean: bean,
      markup,
      exp
    })
  }

  compile () {

    let context

    if (this.exp[0] === '[') {
      // this is a special type of bean which can be instantly evaluated 
      //  into a static result.
      debug('bean expression is an array literal or object literal')
      debug('simplifying bean...')
      const [ contextStr, varName ] = this.exp.split('as').map( s => s.trim() )
      // string 2 array
      context = contextStr
                .slice(1, -1)
                .split(/, ?/)
                .map( val => val.replace(regex.quotes, ''))
      // interpolate the array values into the expanded markup
      this.result = context.map( val => this.markup.replace(new RegExp('\\$\\{'+varName+'\\}', 'g'), val)).join('')
    
    } else {
      debug('setting compile fn')
      this.tpl = (context, opts) => {
        // interpolate
        return this.markup.replace(regex.interpolation, (match) => {
          // parse the interpolation key
          const key = match.match(regex.interpolation_stripped)[1]
          debug('replacing ', match, ' with ', context[key])
          return context[key]
        })
      }
      if (this.exp[0] === '{') {
        debug('bean expression is an object literal')
        context = JSON.parse(this.exp)
        // bind the object as the default context of this markup
        this.tpl = this.tpl.bind(this, context)
      }
    }
  }

  evaluate (context) {
    // if using evaluate straight-away as a shortcut method
    if (!this.tpl && !this.result) {
      this.compile()
    }
    return this.result || this.tpl(context)
  }
}

exports.Beans = class Beans {
  constructor (str) {
    debug('extracting beans from ', str.slice(0, 100)+'...')
    
    const entries = []
    let match

    while ((match = regex.beanMatcher.exec(str)) !== null) {
      debug('found match:::', match[1])
      // grab any text before the match, including the one-character non-capturing
      //  group which checks if the tick-mark is escaped (preceded by a \)
      const temp = str.slice(0, match.index + 1)
      
      if (temp) {
        debug('found a non-bean:::', temp)        
        entries.push(temp)
      }

      // gradually whittle the str down to make our exec faster
      str = str.slice(match.index + match[0].length)

      entries.push(new Bean(match[1]))
    }

    debug('pushing tail:::', str)
    // push any final value of str which didn't contain a bean
    entries.push(str)

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
