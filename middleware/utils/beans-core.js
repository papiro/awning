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
      debug(`Found match:::${match}`)

      const 
        [ original, openingBeanTag, bean, inlineBean ] = match,
        matchIndex = match.index
      let
        bns = bean || inlineBean

      // First some ritual:
      // Grab any stray regular HTML markup.
      if (previousMatchEnd < matchIndex) {
        const inBetweener = markup.slice(previousMatchEnd, matchIndex)
        debug(`Markup in between beans:::${inBetweener}`)
        pieces.push({ markup: inBetweener })
      }

      previousMatchEnd = matchIndex + original.length

      // Now onto business:
      bns = bns.trim()
      debug(`Bean:::${bns}`)

      let beanId
      if (bean) {
        if (!(beanId = openingBeanTag.match(/id=['"](.*)['"]/))) {
          throw new ReferenceError(`Bean in ${markup} must have a valid "id" attribute.`)
        } else {
          beanId = beanId[1]
          debug(`Bean ID:::${beanId}`)
          const precompiled = precompile(bns, beanId)
          debug(`Precompiled match:::${precompiled}`)
          pieces.push({ fn: precompiled, id: beanId })
        }
      } else if (inlineBean) {
        const compiled = compile(bns)
        debug(`Compiled match:::${compiled}`)
        pieces.push({ markup: compiled })
      } else {
        debug('Something is terribly wrong...')
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
  const [signature, markup] = splitBean(bean)  
  const [context_external, context_internal] = splitBeanSignature(signature)
  if (context_external[0] === '[') {
    // this is a special type of bean which can be instantly evaluated 
    //  into a static result.
    debug('bean expression is an array literal or object literal')
    debug('simplifying bean...')
    // stringed-array 2 array
    const context = context_external
              .slice(1, -1)
              .split(/, ?/)
              .map( val => val.replace(regex.quotes, ''))
    // interpolate the array values into the expanded markup
    return context.map( val => bean.replace(new RegExp('\\$\\{'+context_internal+'\\}', 'g'), val)).join('')
  
  } else {
//    debug('setting compile fn')
//    this.tpl = (context, opts) => {
//      // interpolate
//      return this.markup.replace(regex.interpolation, (match) => {
//        // parse the interpolation key
//        const key = match.match(regex.interpolation_stripped)[1]
//        debug('replacing ', match, ' with ', context[key])
//        return context[key]
//      })
//    }
//    if (this.exp[0] === '{') {
//      debug('bean expression is an object literal')
//      context = JSON.parse(this.exp)
//      // bind the object as the default context of this markup
//      this.tpl = this.tpl.bind(this, context)
//    }
  }
}

function precompile (bean, beanId) {
  const [signature, markup] = splitBean(bean)  
  const [, context_internal] = splitBeanSignature(signature)

  return new Function('collection', 
    `
      if (!Array.isArray(collection) && !(typeof collection === 'object')) {
        throw new TypeError(\`Argument to ${beanId} must be an array or object\`)
      }
      return [].concat(collection).map(${context_internal} => \`${markup}\`).join('')
    `
  )
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
