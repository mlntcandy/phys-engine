import logger from './physlogger.js'
import express from 'express'
import bodyParser from 'body-parser'

export default class WebServer {
    constructor(port, middleware = []) {
        this.app = express()

        for (let mw of middleware) {
            switch (typeof mw) {
                case 'function':
                    this.app.use(mw)
                    break

                default:
                    function InvalidMiddlewareTypeException() {
                        this.message = "WebServer middleware should be a function"
                    }
                    throw new InvalidMiddlewareTypeException()
            }
        }
        this.app.use(bodyParser.urlencoded({ extended: false }));
        this.app.listen(port, () => {
            logger.log(`WebServer listening at http://localhost:${port} !`);
        })
    }

    html(path, func) {
        this.app.get(path, async (req, res) => {
            let html = await func(req)
            if (typeof html == 'number') return res.sendStatus(html)
            res.set('Content-Type', 'text/html')
            res.send(Buffer.from(html))
        })
    }

    serveStatusCodes(func) {
        
    }

}