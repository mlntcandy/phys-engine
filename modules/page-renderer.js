import ejs from 'ejs'

export default class PageRenderer {
    constructor(viewspath) {
        this.viewspath = viewspath
    }

    render(view, content) {
        return ejs.renderFile(this.viewspath + (view + '.ejs'), content)
    }
}