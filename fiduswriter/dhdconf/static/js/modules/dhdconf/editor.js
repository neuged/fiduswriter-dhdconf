

export class DhdconfEditor {
    constructor(editor) {
        this.editor = editor
    }

    init() {
        const exportMenu = this.editor.menu.headerbarModel.content.find(menu => menu.id === "export")
        exportMenu.content = [
            {
                title: gettext("TEI"),
                type: "action",
                tooltip: gettext("Export the document to a TEI file."),
                order: 5,
                action: editor => {
                    import("../exporter/tei").then(({exportTEI}) => {
                        exportTEI(
                            editor.getDoc({changes: 'acceptAllNoInsertions'}),
                            editor.mod.db.bibDB,
                            editor.mod.db.imageDB,
                            editor.app.csl
                        )
                    });
                }
            }
        ];
    }
}
