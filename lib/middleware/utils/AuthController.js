'use strict'

const
  debug = require('util').debuglog('awning.auth')
,
  EventEmitter = require('events')
,
  Database = require('sqlite3').Database,
  usersDbName = 'users.db',
  usersDb = require('path').dirname(module.parent.parent.filename) + '/' + usersDbName
,
  crypto = require('crypto'),
  pbkdf2_iterations = 100000,
  pbkdf2_keylen = 512,
  pbkdf2_digestAlgorithm = 'sha512',
  saltLength = 32
;

module.exports = class AuthController extends EventEmitter {
  constructor () {
    super()

    Object.assign(this, {
      usersDb
    })
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
}
