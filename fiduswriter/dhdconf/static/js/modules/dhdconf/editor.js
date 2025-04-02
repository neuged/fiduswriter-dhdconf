import {addAlert} from "../../modules/common"

import {config} from "./config"
import {DhdConfHtmlExporter, DhdConfDocxExporter} from "./exporter"
import {injectCitationStyle} from "./citationstyle";

function showSucces() {
    addAlert("success", gettext("Export finished"))
}

function showError(e) {
    addAlert("error", `Export error: '${e.message}'`)
    console.error(e)
}

export class DhdconfEditor {
    constructor(editor) {
        this.editor = editor

    }

    async init() {
        // if the citation style was not injected already (app.js) we need to inject it
        // here and blockingly for it to take effect before the bibliography is rendered
        await injectCitationStyle(this.editor?.app?.csl)

        const menus = this.editor.menu.headerbarModel.content

        const exportMenu = menus.find(menu => menu.id === "export")
        exportMenu.content = [
            {
                title: gettext("HTML"),
                type: "action",
                tooltip: gettext("Export the document to an HTML file"),
                order: 1,
                action: editor => {
                    const exporter = new DhdConfHtmlExporter(
                        editor.getDoc({changes: "acceptAllNoInsertions"}),
                        editor.mod.db.bibDB,
                        editor.mod.db.imageDB,
                        editor.app.csl,
                        editor.docInfo.updated,
                        editor.mod.documentTemplate.documentStyles
                    )
                    exporter.init().then(showSucces, showError)
                }
            },
            {
                title: gettext("TEI"),
                type: "action",
                tooltip: gettext("Export the document to a TEI file"),
                order: 2,
                action: editor => {
                    import("../exporter/tei").then(({TEIExporter}) => {
                        const exporter = new TEIExporter(
                            editor.getDoc({changes: "acceptAllNoInsertions"}),
                            editor.mod.db.bibDB,
                            editor.mod.db.imageDB,
                            editor.app.csl,
                            editor.docInfo.updated,
                        )
                        exporter.init().then(showSucces, showError)
                    })
                }
            },
            {
                title: gettext("DOCX"),
                type: "action",
                tooltip: gettext("Export the document to a DOCX file"),
                order: 4,
                action: editor => {
                    if (navigator.vendor === "Apple Computer, Inc.") {
                        this.editor.mod.documentTemplate.showSafariErrorMessage()
                        return
                    }
                    const docxExporter = new DhdConfDocxExporter(
                        editor.getDoc({changes: "acceptAllNoInsertions"}),
                        staticUrl(config.docxTemplateLocation),
                        editor.mod.db.bibDB,
                        editor.mod.db.imageDB,
                        editor.app.csl,
                    )
                    docxExporter.init().then(showSucces, showError)
                }
            },
            {
                title: gettext("DHC (HTML + TEI + DOCX)"),
                type: "action",
                tooltip: gettext("Export the document to a DHC archive"),
                order: 3,
                action: editor => {
                    if (navigator.vendor === "Apple Computer, Inc.") {
                        this.editor.mod.documentTemplate.showSafariErrorMessage()
                        return
                    }
                    import("../exporter/dhc").then(({exportDHC}) => {
                        exportDHC(
                            editor.getDoc({changes: "acceptAllNoInsertions"}),
                            editor.mod.db.bibDB,
                            editor.mod.db.imageDB,
                            editor.app.csl,
                            editor.docInfo.updated,
                            editor.mod.documentTemplate.documentStyles,
                            staticUrl(config.docxTemplateLocation)
                        ).then(showSucces, showError)
                    })
                }
            },
        ]

        if (config.removeUniversalActionsFromTrackChangesMenu) {
            const changesMenu = menus.find(menu => menu.title === gettext("Track changes"))
            changesMenu.content = changesMenu.content.filter(item => {
                return !(
                    item.title === gettext("Accept all") ||
                    item.title === gettext("Reject all")
                )
            })
        }
    }
}
