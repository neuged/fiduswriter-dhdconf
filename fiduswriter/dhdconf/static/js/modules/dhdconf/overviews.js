
import {config} from "./config"


function removeFromArray(array, predicate) {
    const idx = array.findIndex((i) => predicate(i))
    if (idx >= 0) {
        array.splice(idx, 1)
    }
}

function removeCategoriesFromMenu(menu) {
    removeFromArray(menu, (entry) => entry.id === "cat_selector")
    removeFromArray(menu, (entry) => entry.title === gettext("Edit Categories"))
}


export class DhdconfBibliographyOverview {
    constructor(overview) {
        this.overview = overview
    }

    init() {
        if (config.removeCategoryOptionsFromBibliography) {
            removeCategoriesFromMenu(this.overview.menu.model.content)
        }
    }
}

export class DhdconfImagesOverview {
    constructor(overview) {
        this.overview = overview
    }

    init() {
        if (config.removeCategoryOptionsFromImagesOverview) {
            removeCategoriesFromMenu(this.overview.menu.model.content)

            // Removal of category selection throws an error in image_overview, so we add a dummy
            // TODO: Find a better way to prevent that error than this hack
            this.overview.menu.model.content.push({
                id: "cat_selector",
                content: [],
                open: false,
                order: 99,
                type: "invalid_type"
            })
        }
    }
}

export class DhdconfDocumentsOverview {
    constructor(overview) {
        this.overview = overview
    }

    init() {
        if (config.removeFolderCreationOption) {
            removeFromArray(
                this.overview.menu.model.content,
                (entry) => entry.title === gettext("Create new folder")
            )
        }
    }
}
