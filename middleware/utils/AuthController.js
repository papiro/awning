'use strict'

const
  debug = require('util').debuglog('awning.auth')
,
  EventEmitter = require('events'),
  crypto = require('crypto')
,
  AwningStore = require('awning').Store,
  _sessions = [],
  _users = new AwningStore('users.db.json')
,
  otpStrLength = 6
,
  { hasher } = require('awning').utils
;

class AuthController extends EventEmitter {
  constructor () {
    super()
  }

  user: {
    create (username, password) {
      debug('creating user:::', username)
      debug('with password:::', password)
 
      // Generate salt
      const salt = await new Promise( (resolve, reject) => {
        crypto.randomBytes(saltLength, (err, buf) => {
          if (err) throw err
          resolve(buf.toString())
        })
      })
    
      debug('generated salt:::', salt)
    
      // Generate password hash
      const hashedPassword = await new Promise( (resolve, reject) => {            
        crypto.pbkdf2(password, salt, pbkdf2_iterations, pbkdf2_keylen, pbkdf2_digestAlgorithm, (err, hashedPassword) => {
          if (err) throw err
          resolve(hashedPassword.toString())
        })
      })
      
      debug('hashed password is:::', hashedPassword)
      
      _users[username] = {
        password: hashedPassword,
        salt
      }
      this.emit('user.create.success')
    }
  }

  hash: {
    async create (str, salt) {
      return await hasher(str, salt)
    }
    async verify (str, hash, salt) {
      const hashedStr = await hasher(str, salt)
      return hashedStr === hash
    }
  }

  session: {
    init (res) {
      const 
        uuid = crypto.randomBytes(16).toString('hex'),
        expires = 900//seconds
      ;
      _sessions.push({ uuid, expires: Date.now() + expires * 1000 })
      debug(`Setting HttpOnly Cookie: AWNID=${uuid}`)
      res.setHeader('Set-Cookie', `AWNID=${uuid}; HttpOnly; Max-Age=900; Path=/`) // TODO: add "Secure"
    }

    isValid ({ cookies }) {
      if (!cookies) return false
      
      const awnid = cookies.AWNID
      if (!awnid) return false
      debug('Detected awnid: ', awnid)

      debug('Sessions: ', _sessions)

      const session = _sessions.find(session => ( session.uuid === awnid ))
      if (session && Date.now() <= session.expires) return true

      return false    
    }
  }

  isProtectedResource ({ url: req_url, params: req_params, method: req_method }, protectedResourcesConfig) {
    return protectedResourcesConfig.some( config => {
      if (config instanceof Object === false) throw new TypeError('protected resources need to be objects with url/urlRegex/method/query properties')
      const { url, urlRegex, method, query } = config
      if (!Object.keys(config).length
          || url && req_url !== url 
          || method && req_method !== method 
          || urlRegex && !urlRegex.test(req_url)) {
        return false
      } else if (query) {
        return Object.keys(query).every(param => req_params[param] === query[param])
      } else {
        return true
      }
    })
  }

  userLogin (username, password) {

  }

  sendOtpCode (username) {

  }

  otpLogin (code) {

  }
}

// Export singleton
module.exports = new AuthController()

// userCreate (username, password) {
//   debug('creating user:::', username)
//   debug('with password:::', password)
//   // Open database
//   const db = new Database(this.usersDb, err => {
//     if (err) {
//       return this.emit('user.create.fail', err)
//     }
// 
//     debug(this.usersDb + ' opened successfully!')
// 
//     // Create the table "creds"
//     db.run(`CREATE TABLE creds(
//       id        INTEGER PRIMARY KEY ASC,
//       user      TEXT,
//       password  TEXT,
//       salt      TEXT
//     )`, [], async err => {
//       // errno 1 is a "TABLE ALREADY EXISTS" error
//       //  - in that case, it's okay to proceed
//       if (err && err.errno !== 1) {
//         return this.emit('user.create.fail', err)
//       }
// 
//       // Generate salt
//       const salt = await new Promise( (resolve, reject) => {
//         crypto.randomBytes(saltLength, (err, buf) => {
//           if (err) throw err
//           resolve(buf.toString())
//         })
//       })
// 
//       debug('generated salt:::', salt)
// 
//       // Generate password hash
//       const hashedPassword = await new Promise( (resolve, reject) => {            
//         crypto.pbkdf2(password, salt, pbkdf2_iterations, pbkdf2_keylen, pbkdf2_digestAlgorithm, (err, hashedPassword) => {
//           if (err) throw err
//           resolve(hashedPassword.toString())
//         })
//       })
//       
//       debug('hashed password is:::', hashedPassword)
//       
//       db.run(`INSERT INTO creds VALUES(NULL, ?, ?, ?)`, [username, hashedPassword, salt], err => {
//         if (err) {
//           return this.emit('user.create.fail', err)
//         }
//         debug('insert into table successful!')
//         this.emit('user.create.success')
//       })
//     })
//   })
// }

