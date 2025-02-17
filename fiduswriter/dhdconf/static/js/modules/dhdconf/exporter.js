
import {HTMLExporter} from "../../modules/exporter/html2"

export class DhdConfHtmlExporter extends HTMLExporter {
    init() {
        this.styleSheets.push({url: staticUrl("css/dhdconf_export_html.css")})
        return super.init()
    }
}
