import {activateWait, deactivateWait, addAlert, postJson} from "../common"
import {config} from "./config"

function removeMenuItem(items, predicate) {
    const idx = items.findIndex(predicate)
    if (idx >= 0) {
        items.splice(idx, 1)
    }
}

function hideMenuElement(items, predicate) {
    // Some menu items (ids: cat_selector, new_document) are expected to exist by other
    // parts of fiduswriter. Since we cannot remove them, we set an invalid type
    // which renders an empty tag (see common/overview_menu.js, dhdconf.css)
    items.filter(predicate).forEach((item) => {
        item.type = "hidden_overview_menu_entry"
    })
}

function removeCategoriesFromMenu(menu) {
    hideMenuElement(menu, (entry) => entry.id === "cat_selector")
    removeMenuItem(menu, (entry) =>
        [gettext("Edit Categories"), gettext("Edit categories")].includes(entry.title)
    )
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
        }
    }
}


export class DhdconfDocumentsOverview {
    constructor(overview) {
        this.overview = overview
    }

    init() {
        const content = this.overview.menu.model.content
        if (config.removeFolderCreationOption) {
            removeMenuItem(content, (entry) => entry.title === gettext("Create new folder"))
        }
        if (config.removeDocumenCreationOptions) {
            removeMenuItem(content, (entry) => entry.title === gettext("Upload FIDUS document"))
            removeMenuItem(content, (entry) => entry.title === gettext("Import document"))
            hideMenuElement(content, (entry) => entry.id === "new_document")
            // the "New document" button gets recreated after plugin intialization so
            // we activate a bit of custom css to actually hide it
            // (see: documents/overview/index.js, dhdconf.css)
            document.body.dataset.hideNewDocumentOption = "true"
        }

        this.overview.menu.model.content.push({
            id: "conftool_sync",
            type: "button",
            title: gettext("ConfTool: Synchronise"),
            action: () => {
                let unvalidatedEmails = []
                return this.refreshUser()
                    .then(response => response.json)
                    .then(data => {
                        this.showSuccess(data)
                        unvalidatedEmails = data.unvalidatedEmails
                        return this.refreshSubmissions()
                    })
                    .then(response => response.json)
                    .then(data => {
                        this.showSuccess(data)
                        return this.refreshDocuments()
                    })
                    .catch(
                        response => response.json().then(data => this.showError(data))
                    )
                    .finally(() => {
                        this.addUnvalidatedEmailsAlert(unvalidatedEmails)
                        deactivateWait()
                    })
            },
            order: 1,
        })
    }

    refreshUser() {
        activateWait(false, gettext("Importing user data and verified emails"))
        return postJson("/api/dhdconf/refresh_conftool_user/")
    }

    refreshSubmissions() {
        activateWait(false, gettext("Importing submissions"))
        return postJson("/api/dhdconf/refresh_conftool_papers/")
    }

    refreshDocuments() {
        activateWait(false, gettext("Fetching documents"))
        return this.overview.getDocumentListData()
    }

    showSuccess(data) {
        addAlert("success", data.message)
    }

    showError(data) {
        let message = "Unknown error"
        if (data?.message) message = data.message
        if (data?.requestId) message += ` (${data.requestId})`
        console.warn(message)
        addAlert("error", message)
    }

    addUnvalidatedEmailsAlert(emails) {
        if (emails) {
            emails.forEach(email => addAlert("warning", [
                    gettext("Email"),
                    `"${email}"`,
                    gettext("is not validated with ConfTool."),
                    gettext("Connected submissions might not be shown.")
                ].join(" ")
            ))
        }
    }
}
