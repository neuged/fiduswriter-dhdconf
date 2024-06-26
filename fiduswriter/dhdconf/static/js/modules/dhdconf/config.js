export const config = {
    // Whether to show "Create new folder" in the folder document overview
    removeFolderCreationOption: true,

    // Whether to show category options in the "bibliography" or "images" sections
    removeCategoryOptionsFromBibliography: true,
    removeCategoryOptionsFromImagesOverview: true,

    // The path at which to expect the docx template used in the DHC export
    dhcExporterDocxTemplateUrl: "/media/export-template-files/Classic.docx",

    // Checks used before exporting
    teiExportMaxWordsInAbstract: 200,
}
