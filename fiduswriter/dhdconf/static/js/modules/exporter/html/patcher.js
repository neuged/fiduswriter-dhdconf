import {HTMLExporterConvert} from "./convert"

const {analyze, init, walkJson} = HTMLExporterConvert.prototype

HTMLExporterConvert.prototype.init = function() {
    this.orcidIds = []
    return init.call(this)
}

HTMLExporterConvert.prototype.analyze = function(node) {
    switch (node.type) {
        case "tags_part":
            if (node.attrs.id === "orcidIds" && node.content) {
                node.content.forEach(tag => {
                    if (tag.attrs.tag !== "<ORCID: N/A>") {
                        this.orcidIds.push(tag.attrs.tag)
                    } else {
                        this.orcidIds.push(null)
                    }
                })
            }
            break
    }

    return analyze.call(this, node)
}

HTMLExporterConvert.prototype.walkJson = function(node, options = {}) {
    switch (node.type) {
        case "title":
            return ""

        case "tags_part":
            if (node.attrs.id === "orcidIds")
                return ""
    }

    const result = walkJson.call(this, node, options)

    switch (node.type) {
        case "contributors_part":
            if (!result) return ""

            const dom = new DOMParser().parseFromString(result, "text/html")
            dom.querySelectorAll(".person").forEach((element, i) => {
                if (!(element = element.querySelector("a"))) return;
                element.replaceWith(element = dom.createElement("span"))

                element.innerHTML += " ("
                element.appendChild(Object.assign(dom.createElement("span"), {
                    innerHTML: node.content[i].attrs.institution
                }))

                if (this.orcidIds[i]) {
                    element.innerHTML += "; "
                    element.appendChild(Object.assign(dom.createElement("a"), {
                        href: `https://orcid.org/${this.orcidIds[i]}`,
                        innerHTML: `orcid.org/${this.orcidIds[i]}`
                    }))
                }

                element.innerHTML += ")"
            })

            this.affiliations = {}
            return dom.body.innerHTML
    }

    return result
}
