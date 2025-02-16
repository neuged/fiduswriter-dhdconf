// TODO: Make this configurable in our app_settings.py, cf. base/weback.config.template.js
export const config = {
    // Whether to show "Create new folder" in the folder document overview
    removeFolderCreationOption: true,

    // Whehter to show document creation and import options to the users
    removeDocumenCreationOptions: true,

    // Whether to show category options in the "bibliography" or "images" sections
    removeCategoryOptionsFromBibliography: true,
    removeCategoryOptionsFromImagesOverview: true,

    // The path at which to expect the docx template used in the DHC export
    dhcExporterDocxTemplateUrl: "/media/export-template-files/Classic.docx",

    // Checks used before exporting
    teiExportMaxWordsInAbstract: 200,
}
