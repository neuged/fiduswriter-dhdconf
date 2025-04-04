// TODO: Make this configurable in our app_settings.py, cf. base/weback.config.template.js
export const config = {
    // Whether to show "Create new folder" in the folder document overview
    removeFolderCreationOption: true,

    // Whether to show document creation and import options to the users
    removeDocumenCreationOptions: true,

    // Whether to show category options in the "bibliography" or "images" sections
    removeCategoryOptionsFromBibliography: true,
    removeCategoryOptionsFromImagesOverview: true,

    // Whether to remove "Accept All", "Reject All" from the change tracking menu
    removeUniversalActionsFromTrackChangesMenu: true,

    // Whether to hide the Bibliography menu from the main menu
    hideBibliographyMenu: true,

    // The static path at which to expect the docx template used in the DHC export
    docxTemplateLocation: "assets/dhdconf.docx",

    // Whether to remove comments from the docx export
    docxRemoveComments: true,

    // The static path to our citation style definition and which style to override
    citationStyleLocation: "assets/dhdconf.csljson",
    citationStyleKey: "chicago-author-date-de",
}
