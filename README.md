# Awning is a junked car

Leaving awning here for usage of parts. Awning was an awesome project I spent a lot of time on but lost interest in maintaining. It is a web-server, built to be fast and efficient and to not use a single dependency other than other libraries I had also built from scratch using no dependencies.

It implemented extensibility through the usage of "middleware" (a concept not borrowed directly from Express, but turned out to be almost exactly similar) and worked extremely well, powering several small sites I was working on.

It was built with security and performance in mind, and provided a very simple api to create REST services; an authentication layer, an authorization mechanism (through the usage of a "protected resources" blacklist), URL rewriting, a templating engine designed and built from scratch, a build step which interpolated variable values in CSS files, a simple in-memory DB persistable to a JSON file, logging, and the ability to serve static files.  

Leaving awning here as a showcase of my knowledge, and to be scrapped for its several gleaming functions and utilities.
