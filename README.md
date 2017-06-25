# Awning
Awning is a work-in-progress to become an easy-to-use, opinionated, and therefore minimally-configured web server.

Awning uses the concept of middleware to provide an extensible and easily pluggable interface for acting upon requests/responses.  A middleware function looks like this:
```
module.exports = function middleware (req, res, done) {
  // do stuff with req
  // do stuff with res
  done() // to continue to the next middleware
  done(false) // to stop here and end the response
}
```

## Out of the box middleware (in proposed order):
1. REST: inspects request.url to see if it matches any api endpoints in the awning config
2. rewrite: rewrites request.url based on any rules present in the awning config
3. headers.mimeType: sets the `Content-Type` response header based on the file extension of the requested resource.  // TODO - this needs to rely on the file's magic #'s
4. headers.caching: used to set any response headers which control caching.  Under construction but will currently set the `Expires` header to the current date and time (to effectively disable caching)
5. beans: Beans is a templating language which is currently in the middle of development for its server-side implementation through this middleware
6. static: if the request makes it this far, this middleware will attempt to serve a file based on the request.url

## Awning config
An application's server file would look something like this:
```
require('awning')({
  name: 'Application1.com',
  root: require('path').join(__dirname, 'public'),
  port: 5555,
  uid: 'pierre', // only works for *nix users.  If you need to elevate privelages (say if you were running on port 80), then Awning would attempt to drop privelages to the user mentioned here.
  api: {
    '/api/server-uptime': ['GET'],
    '/api/reboot-server-with-options': ['POST']
  },
  socketTimeout: 3000,
  onError (err) {
    // handle server err
  },
  onRequest (req) {
    // some "local" request logic - it's run order is not guaranteed
  },
  rewrite: {
    '/\\.': { // any requests for dot-files will get a redirect to airbnb
      status: 301,
      headers: {
        location: 'https://airbnb.com',
        f: 'u'
      }
    },
    '/$': '/index.bns' // requests which end in '/' will be rewritten to request '/index.bns', a beans file
  },
  middleware: [
    // 'logerr',
    'REST',
    'rewrite',
    'headers.mimeType',
    'headers.caching',
    'beans',
    'static'
  ].map( middleware => require(`./node_modules/awning/lib/middleware/${middleware}`) )
})
```

## Awning is under active development
Awning is developed as use-cases are found.  Because it is being developed in tandem with the development of [LivityJS](https://www.github.com/papiro/livity) which is being developed, along with Awning, to support the development of several apps, many unconventional use-cases are able to be avoided in favor of a simpler solution on the front-end.  There are also certain activities which are better suited for a reverse-proxy/load-balancer which don't have much development in awning, such as support for virtual hosts.  Middleware like `headers.mimeType` may also go the way of the dinosaurs if it doesn't seem simple to get right or is not practically implemented in Node.js.
