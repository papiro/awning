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

    // make these available on the instance
    Object.assign(this, { markup })

    let context

    if (exp[0] === '[') {
      // this is a special type of bean which can be instantly evaluated 
      //  into a static result.
      debug('bean expression is an array literal or object literal')
      debug('simplifying bean...')
      const [ contextStr, varName ] = exp.split('as').map( s => s.trim() )
      // string 2 array
      context = contextStr
                .slice(1, -1)
                .split(/, ?/)
                .map( val => val.replace(/^['"]|['"]$/g, ''))
      // interpolate the array values into the expanded markup
      this.result = context.map( val => markup.replace(new RegExp('\\$\\{'+varName+'\\}'), val)).join('')
    
    } else {
      this.tpl = (context, opts) => {
        // interpolate
        return this.markup.replace(/\$\{.*\}/, (match) => {
          // parse the interpolation key
          const key = match.match(/(?:\$\{)(.*)(?:\})/)[1]
          debug('replacing ', match, ' with ', context[key])
          return context[key]
        })
      }
      if (exp[0] === '{') {
        debug('bean expression is an object literal')
        context = JSON.parse(exp)
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
