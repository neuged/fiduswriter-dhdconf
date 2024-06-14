import {addAlert} from "../../modules/common"

import {config} from "./config";

export class DhdconfEditor {
    constructor(editor) {
        this.editor = editor
    }

    init() {
        const exportMenu = this.editor.menu.headerbarModel.content.find(menu => menu.id === "export")

        exportMenu.content = [
            {
                title: gettext("HTML"),
                type: "action",
                tooltip: gettext("Export the document to an HTML file."),
                order: 1,
                action: editor => {
                    import("../exporter/html2").then(({HTMLExporter}) => {
                        const exporter = new HTMLExporter(
                            editor.getDoc({changes: "acceptAllNoInsertions"}),
                            editor.mod.db.bibDB,
                            editor.mod.db.imageDB,
                            editor.app.csl,
                            editor.docInfo.updated,
                            editor.mod.documentTemplate.documentStyles
                        )
                        exporter.init().then(
                            () => addAlert("success", gettext("Export finished")),
                            (e) => {
                                addAlert("error", `Export error: '${e.message}'`)
                                console.error(e)
                            }
                        )
                    })
                }
            },
            {
                title: gettext("TEI"),
                type: "action",
                tooltip: gettext("Export the document to a TEI file."),
                order: 2,
                action: editor => {
                    import("../exporter/tei").then(({TEIExporter}) => {
                        const exporter = new TEIExporter(
                            editor.getDoc({changes: 'acceptAllNoInsertions'}),
                            editor.mod.db.bibDB,
                            editor.mod.db.imageDB,
                            editor.app.csl,
                            editor.docInfo.updated,
                        )
                        exporter.init().then(
                            () => addAlert("success", gettext("Export finished")),
                            (e) => {
                                addAlert("error", `Export error: '${e.message}'`)
                                console.error(e)
                            }
                        )
                    });
                }
            },
            {
                title: "DHC (TEI + HTML + DOCX)",
                type: "action",
                tooltip: gettext("Export the document to a DHC archive"),
                order: 3,
                action: editor => {
                    import("../exporter/dhc").then(({exportDHC}) => {
                        exportDHC(
                            editor.getDoc({changes: 'acceptAllNoInsertions'}),
                            editor.mod.db.bibDB,
                            editor.mod.db.imageDB,
                            editor.app.csl,
                            editor.docInfo.updated,
                            editor.mod.documentTemplate.documentStyles,
                            config.dhcExporterDocxTemplateUrl
                        ).then(
                            () => addAlert("success", gettext("Export finished")),
                            (e) => {
                                addAlert("error", `Export error: '${e.message}'`)
                                console.error(e)
                            }
                        )
                    })
                }
            }
        ]
    }
}
