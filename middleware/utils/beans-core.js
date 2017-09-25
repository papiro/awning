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
    inlineBeanMatcherString: `(?:[^\\\\])${inlineBeanDelimiter}([\\s\\S]*?[^\\\\])${inlineBeanDelimiter}`,
    beanSplitter: /[\s\n]*=>[\s\n]*/,
    beanSigSplitter: / as /
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
        if (!(beanId = openingBeanTag.match(/id=['"]([^'"]*)['"]/))) {
          throw new ReferenceError(`Bean in ${markup} must have a valid "id" attribute.`)
        } else {
          beanId = beanId[1]
          const isJS = /data-js[ >]/.test(openingBeanTag)
          let dataAs = openingBeanTag.match(/data-as=['"](.*)['"]/)
          let dataArgs = openingBeanTag.match(/data-args=['"](.*)['"]/)
          dataArgs = dataArgs && dataArgs[1]
          dataAs = dataAs && dataAs[1]

          debug(`Bean ID:::${beanId}`)
          debug(`Bean data args:::${dataArgs}`)
          debug(`Bean is js:::${isJS}`)
          debug(`Bean data as:::${dataAs}`)
          const precompiled = isJS ? precompileJS(bns, dataAs) : precompile(bns, beanId)
          debug(`Precompiled match:::${precompiled}`)
          pieces.push({ fn: precompiled, id: beanId, args: dataArgs })
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

function splitBean (str, regex) {
  let split = str.split(regex)
  if (split.length === 1) {
    split = [,split[0]]
  }
  return split
}

function strToArr (str) {
  let ret = str.slice(1, -1)
  const isCollection = (ret.trim()[0] === '{')
  const splitterRegex = ( isCollection ? /\{[^\}]*\}/g : /[\w]+/g )
  ret = ret.match(splitterRegex)

  if (isCollection) {
    ret.reduce( (obj, keyVals) => {
      const reg = /(\w+)|'([^']*)'|"([^"]*)"/g
      let match, queue = [] 
      while(match = reg.exec(keyVals)){
        // If more than one match, prefer last match (more restrictive).
        queue.push(match[2] || match[1] || match[0])
        if (queue.length === 2) {
          const [key, val] = queue
          obj[key] = val
          queue = []
        }
      }
      return obj
    }, {})
  }  

  return ret
}

function compile (bean) {
  const [signature, markup] = splitBean(bean, regex.beanSplitter)  
  debug(`Signature:::${signature}`)
  debug(`Markup:::${markup}`)
  const [context_external, context_internal] = splitBean(signature, regex.beanSigSplitter)
  debug(`ctx_external:::${context_external}`)
  debug(`ctx_internal:::${context_internal}`)
  const fn = new Function(context_internal, `return \`${markup}\``)
  debug(fn.toString())
  const args = eval(context_external)
  const ret = args.map(fn).join('')
  return ret
//  if (context_external[0] === '[') {
//    // This is a special type of bean which can be instantly evaluated 
//    //  into a static result.
//    debug('bean expression is an array literal or object literal.')
//
//    const replacerRegex = new RegExp('\\$\\{'+context_internal+'\\}', 'ig')
//    
//    const context = strToArr(context_external)
//    function foo (...args) { console.log(...args) }
//    const output = foo`${(`${markup}`)}`
//    console.log(output)
//    // interpolate the array values into the expanded markup
//    //return strToArr(context_external).map( item => markup.replace(replacerRegex, match => {})).join('')
//  
//    }
}

function precompileJS (bean, as = 'data') {
  const fn = new Function(as, bean)
  return fn
}

function precompile (bean, beanId) {
  const [signature, markup] = splitBean(bean, regex.beanSplitter)  
  debug(`Signature:::${signature}`)
  debug(`Markup:::${markup}`)

  if (!signature) {
    return new Function('data', 
      `
        function bound () {
          return \`${markup}\`
        }
        return bound.bind(data)()
      `
    )
  }

  const [, context_internal] = splitBean(signature, regex.beanSigSplitter)
  debug(`ctx_internal:::${context_internal}`)

  return new Function('collection', 
    `
      if (!Array.isArray(collection) && !(typeof collection === 'object')) {
        throw new TypeError(\`Argument to ${beanId} must be an array or object\`)
      }
      return [].concat(collection).map(${context_internal} => \`${markup}\`).join('')
    `
  )
}

