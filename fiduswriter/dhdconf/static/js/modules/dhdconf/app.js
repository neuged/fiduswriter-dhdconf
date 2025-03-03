import {ensureCSS} from "../common"
import {config} from "./config";
import {injectCitationStyle} from "./citationstyle";

export class DhdconfApp {
    constructor(app) {
        this.app = app
    }

    init() {
        injectCitationStyle(this.app?.csl)  //  NOTE: csl not available if user logged out, see editor.js
        return ensureCSS([
            staticUrl("css/dhdconf.css")
        ])
    }
}
