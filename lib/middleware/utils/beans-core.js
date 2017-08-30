'use strict'

const
  util = require('util'),
  debug = util.debuglog('awning.beans')
,
  inlineBeanDelimiter = '`',
  beanTag = 'bean',
  regex = {
    quotes: /^['"]|['"]$/g,
    interpolation: /\$\{.*\}/g,
    interpolation_stripped: /(?:\$\{)(.*)(?:\})/g,
    beanMatcherString: `(<${beanTag}.*>)([\\s\\S]*)(?:<\/${beanTag}>)`,
    inlineBeanMatcherString: `(?:[^\\\\])${inlineBeanDelimiter}([\\s\\S]*?[^\\\\])${inlineBeanDelimiter}`
  }
,
  masterRegEx = new RegExp(regex.beanMatcherString + '|' + regex.inlineBeanMatcherString, 'g')
;

module.exports = {
  getPieces ({ markup }) {
    let match, previousMatchEnd = 0
    const pieces = []

    while ((match = masterRegEx.exec(markup)) !== null) {
      const beanId = match[1].match(/id=['"](.*)['"]/)[1]

      // Grab any stray regular HTML markup.
      if (previousMatchEnd < match.index) {
        const inBetweener = markup.slice(previousMatchEnd, match.index)
        debug(`Markup in between beans:::${inBetweener}`)
        pieces.push({ markup: inBetweener })
      }

      const 
        matchIndex = match.index,
        beanMatch = match[0],
        // Get the actual match from the array.
        actualMatch = match[2]
      ;

      console.log(match)
      previousMatchEnd = matchIndex + beanMatch.length
      match = actualMatch.trim()

      debug(`Bean ID:::${beanId}`)
      debug(`Match:::${match}`)

      if (beanId) {
        const precompiled = precompile(match)
        debug(`Precompiled match:::${precompiled}`)
        pieces.push({ fn: precompiled, id: beanId })
      } else {
        const compiled = compile(match)
        debug(`Compiled match:::${compiled}`)
        pieces.push({ markup: compiled })
      }
    }
    // Grab any remaining tail
    if (previousMatchEnd < markup.length) {
      const tailMarkup = markup.slice(previousMatchEnd)
      debug(`Markup at tail:::${tailMarkup}`)
      pieces.push({ markup: tailMarkup })
    }

    return pieces
  }
}

function splitBean (bean) {
  // Extract the signature.
  return bean.split(/[\s\n]*=>[\s\n]*/)
}

function splitBeanSignature (beanSig) {
  // Extract the variable name (external) and its iterator (internal).
  return beanSig.split(' as ')
}

function compile (bean) {
  let context
  if (context_external[0] === '[') {
    // this is a special type of bean which can be instantly evaluated 
    //  into a static result.
    debug('bean expression is an array literal or object literal')
    debug('simplifying bean...')
    const [ contextStr, varName ] = this.exp.split(' as ')
    // stringed-array 2 array
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

function precompile (bean, beanId) {
  const [signature, markup] = splitBean(bean)  
  const [context_external, context_internal] = splitBeanSignature(signature)
  const internMatcher = RegExp(`\\$\\{${context_internal}\\}`, 'g')

  return new Function('collection', 
    `
      if (!Array.isArray(collection) && !(typeof collection === 'object')) {
        throw new TypeError(\`Argument to ${beanId} must be an array or object\`)
      }
      return [].concat(collection).map(${context_internal} => \`${markup}\`).join('')
    `
  )
}

function scan (str) {
  const inlineBeans = []
  const beans = {}

  // Look for inline beans to be compiled right-away.
  while ((match = regex.inlineBeanMatcher.exec(str)) !== null) {
    debug('found inline bean:::', match[1])
    // grab any text before the match, including the one-character non-capturing
    //  group which checks if the tick-mark is escaped (preceded by a \)
    const temp = str.slice(0, match.index + 1)
    
    if (temp) {
      debug('found interspersed markup:::', temp)        
      inlineBeans.push(temp)
    }

    inlineBeans.push(new InlineBean(match[1]))
  }

  // Look for <bean>'s to be precompiled for usage on an as-need basis in the client.
  while ((match = regex.beanMatcher.exec(str)) !== null) {
    const bean = match[0]
    debug('found bean:::', bean)

    beans.push(new Bean(bean))
  }

  debug('pushing tail:::', str)
  // push any final value of str which didn't contain a bean
  inlineBeans.push(str)
}

class Bean {
  constructor (bean) {

    // make these available on the instance
    Object.assign(this, { 
      stringBean: bean,
      markup,
      exp
    })
  }


  evaluate (context) {
    // If using evaluate straight-away as a shortcut method
    if (!this.tpl && !this.result) {
      this.compile()
    }
    return this.result || this.tpl(context)
  }

  createFn (str) {

  }
}

class InlineBean extends Bean {

}

/*exports.Beans = */class Beans {
  constructor (str) {

    Object.assign(this, inlineBeans, { 
      length: inlineBeans.length,
      inlineBeans,
      beans
    })
  }

  evaluate (context) {
    return this.inlineBeans.map( inlineBean => {
      return inlineBean instanceof Bean ? inlineBean.evaluate(context) : inlineBean
    }).join('')
  }
}
