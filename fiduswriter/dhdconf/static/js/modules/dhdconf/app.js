import {ensureCSS} from "../common"
export class DhdconfApp {
    constructor(app) {
        this.app = app
    }

    init() {
        return ensureCSS([
            staticUrl("css/dhdconf.css")
        ])
    }
}
