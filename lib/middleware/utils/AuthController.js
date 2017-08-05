'use strict'

const
  debug = require('util').debuglog('awning.auth')
,
  EventEmitter = require('events'),
  crypto = require('crypto')
,
  simpleStore = {}
  // usersDbName = 'users.db',
  // usersDb = require('path').dirname(module.parent.parent.filename) + '/' + usersDbName
,
  otpLength = 6
,
  // hasher can also be used as a CLI utility which is why it's a part of Awning's utils and not the middleware's utils.
  hasher = require('../../../utils/hasher.js')
;

class AuthController extends EventEmitter {
  constructor () {
    super()
    this.simpleStore('sessions', [])
  }

  set db (name) {
    switch (name) {
      case 'mongodb':
        break
      case 'sql':
      default:
        this.Database = require('sqlite3').Database
      break
    }
  }

  async hasher (str, salt) {
    return hasher(str, salt)
  }

  userCreate (username, password) {
    debug('creating user:::', username)
    debug('with password:::', password)
    // Open database
    const db = new Database(this.usersDb, err => {
      if (err) {
        return this.emit('user.create.fail', err)
      }

      debug(this.usersDb + ' opened successfully!')

      // Create the table "creds"
      db.run(`CREATE TABLE creds(
        id        INTEGER PRIMARY KEY ASC,
        user      TEXT,
        password  TEXT,
        salt      TEXT
      )`, [], async err => {
        // errno 1 is a "TABLE ALREADY EXISTS" error
        //  - in that case, it's okay to proceed
        if (err && err.errno !== 1) {
          return this.emit('user.create.fail', err)
        }

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
        
        db.run(`INSERT INTO creds VALUES(NULL, ?, ?, ?)`, [username, hashedPassword, salt], err => {
          if (err) {
            return this.emit('user.create.fail', err)
          }
          debug('insert into table successful!')
          this.emit('user.create.success')
        })
      })
    })
  }

  userLogin (username, password) {

  }

  sendOtpCode (username) {

  }

  otpLogin (code) {

  }

  async verifyHash (str, hash, salt) {
    const hashedStr = await this.hasher(str, salt)
    return hashedStr === hash
  }

  simpleStore (key, val) {
    if (!val) return simpleStore[key]
    else simpleStore[key] = val
  }

  initSession (res) {
    const 
      uuid = crypto.randomBytes(16).toString('hex'),
      expires = 900//seconds
    ;
    this.simpleStore('sessions').push({ uuid, expires: Date.now() + expires * 1000 })
    debug(`Setting HttpOnly Cookie: AWNID=${uuid}`)
    res.setHeader('Set-Cookie', `AWNID=${uuid}; HttpOnly; Max-Age=900; Path=/`) // TODO: add "Secure"
  }

  isValidSession ({ cookies }) {
    if (!cookies) return false
    
    const awnid = cookies.AWNID
    if (!awnid) return false
    debug('Detected awnid: ', awnid)

    const sessions = this.simpleStore('sessions')
    debug('Sessions: ', sessions)

    const session = sessions.find(session => ( session.uuid === awnid ))
    if (session && Date.now() <= session.expires) return true

    return false    
  }
}

// Export singleton
module.exports = new AuthController()
