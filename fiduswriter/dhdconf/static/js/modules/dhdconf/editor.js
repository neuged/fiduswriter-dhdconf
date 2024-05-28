

export class EditorDhdconf {
    constructor(editor) {
        this.editor = editor
    }

    init() {
        const exportMenu = this.editor.menu.headerbarModel.content.find(menu => menu.id === "export")

        exportMenu.content.push(
            {
                title: gettext("TEI"),
                type: "action",
                tooltip: gettext("Export the document to a TEI file."),
                order: 5,
                action: editor => {
                    import("./exporter").then(({TeiExporter}) => {
                        const exporter = new TeiExporter(
                        )
                        exporter.init();
                    })
                }
            }

        )
    }

}