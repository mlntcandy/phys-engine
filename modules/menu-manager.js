import fs from 'fs'

export default class MenuManager {
    constructor(menuFile) {
        this.menuFile = menuFile
    }

    get() {
        return JSON.parse(fs.readFileSync(this.menuFile, 'utf-8'))
    }
}