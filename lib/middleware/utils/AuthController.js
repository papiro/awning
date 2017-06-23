'use strict'

const
  util = require('util'),
  debug = util.debuglog('awning.auth')
,
  path = require('path')
,
  EventEmitter = require('events')
,
  sqlite3 = require('sqlite3')
;

module.exports = class AuthController extends EventEmitter {
  constructor () {
    super()

    Object.assign(this, {
      usersDb: path.dirname(module.parent.filename) + '/users.db'
    })
  }

  userCreate (username, password) {
    const db = new sqlite3.Database(this.usersDb, err => {
      if (err) {
        return this.emit('user.create.fail', err)
      }
      debug(this.usersDb + ' opened successfully!')
      db.run(`CREATE TABLE creds(
        id        INTEGER PRIMARY KEY ASC,
        user      TEXT,
        password  TEXT
      )`, [], err => {
        // errno 1 is a "TABLE ALREADY EXISTS" error
        //  - in that case, it's okay to proceed
        if (err && err.errno !== 1) {
          return this.emit('user.create.fail', err)
        }
        db.run(`INSERT INTO creds VALUES(NULL, ?, ?)`, [username, password], err => {
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
