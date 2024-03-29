import logger from './physlogger.js'
import express from 'express'
import bodyParser from 'body-parser'

export default class WebServer {
    constructor(port, middleware = []) {
        this.port = port
        this.app = express()
        this.listening = false
        this.onListenCallback = () => {}
        this.handleHttpError = () => {}


        for (let mw of middleware) {
            this.addMiddleware(mw)
        }

        this.app.use(bodyParser.urlencoded({ extended: false }))

        this.httpserver = this.app.listen(this.port, () => {
            logger.log(`WebServer listening at http://localhost:${port} !`)
            this.listening = true
            this.onListenCallback()
        })
        
    }

    onListen(func) {
        this.onListenCallback = func
    }

    html(path, func) {
        this.app.get(path, async (req, res) => {
            let html = await func(req)
            if (typeof html == 'number') {
                let mw = await this.handleHttpError(html)
                if (mw) {
                    res.status(html)
                    html = mw
                }
            }
            res.set('Content-Type', 'text/html')
            res.send(Buffer.from(html))
        })
    }

    get(path, contentType = 'json', func) {
        this.app.get(path, async (req, res) => {
            let response = await func(req)
            res.set('Content-Type', contentType)
            res.send(Buffer.from(response))
        })
    }

    post(path, contentType = 'json', func) {
        this.app.post(path, async (req, res) => {
            let response = await func(req)
            res.set('Content-Type', contentType)
            res.send(Buffer.from(response))
        })
    }

    addMiddleware(mw) {
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
        if (this.listening) {
            this.httpserver.close()
            delete this.httpserver
            this.httpserver = this.app.listen(this.port, () => {
                logger.log(`WebServer middleware hot-loaded.`);
            })
        }
    }
    serveHttpError(cb) {
        this.handleHttpError = cb
    }

}