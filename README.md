# phys-engine

Node.js ES6 module that powers `phys-site` and `inf-site`.

*Ported from `phys-site`*


## Simple usage example

```js
import physEngine from 'phys-engine'

const webserver = new physEngine.WebServer(3000, [
    physEngine.middleware.serveStatic('static')
])

webserver.html('/', (req) => {
    return "Hello World!"
})
```