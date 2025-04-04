import {config} from "./config"

export class DhdconfMenu {
    constructor(menu) {
        this.menu = menu
    }

    init() {
        if (config.hideBibliographyMenu) {
            this.menu.navItems = this.menu.navItems.filter(item => item.id !== "bibliography")
        }
    }
}