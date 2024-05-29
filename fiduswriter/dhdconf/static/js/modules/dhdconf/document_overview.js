
import {config} from "./config";

export class DhdconfDocumentsOverview {
    constructor(documentsOverview) {
        this.overview = documentsOverview;
    }

    init() {
        if (config.removeFolderCreationOption) {
            const idx = this.overview.menu.model.content.findIndex((entry) => {
                return entry.title === gettext("Create new folder");
            });
            if (idx) {
                this.overview.menu.model.content.splice(idx, 1);
            }
        }
    }
}

