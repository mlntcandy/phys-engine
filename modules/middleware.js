import express from "express"

const middleware = {
    serveStatic: (path) => express.static(path),
}

export default middleware