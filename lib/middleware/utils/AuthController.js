'use strict'

const
  debug = require('util').debuglog('awning.auth')
,
  dirname = require('path').dirname
,
  EventEmitter = require('events')
,
  Database = require('sqlite3').Database
,
  crypto = require('crypto')
;

module.exports = class AuthController extends EventEmitter {
  constructor () {
    super()

    Object.assign(this, {
      usersDb: dirname(module.parent.filename) + '/users.db'
    })
  }

  userCreate (username, password) {
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
      )`, [], err => {
        // errno 1 is a "TABLE ALREADY EXISTS" error
        //  - in that case, it's okay to proceed
        if (err && err.errno !== 1) {
          return this.emit('user.create.fail', err)
        }

        // Generate salt
        let salt = ''
        crypto.randomBytes(32, (err, buf) => {
          if (err) throw err
          salt = buf.toString()
          debug('generated salt:::', salt)
          
          const hashedPassword = crypto.pbkdf2(password, salt, 100000, 512, 'sha512')
        })
        db.run(`INSERT INTO creds VALUES(NULL, ?, ?, ?)`, [username, password, salt], err => {
          if (err) {
            return this.emit('user.create.fail', err)
          }
          debug('insert into table successful!')
          this.emit('user.create.success')
        })
      })
    })
  }
}
