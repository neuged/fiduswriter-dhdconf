import {config} from "./config";

export async function injectCitationStyle(csl) {
    /*
     * HACK
     * This is hacky in multiple ways. To use our citation style throughout the
     * app we simply override another style. That relies on the internals of
     * citeproc-plus, see:
     *  https://github.com/fiduswriter/citeproc-plus/blob/main/src/index.js
     *
     * Also we fetch() rather than import() our style because json files are not
     * included in the django-npm-mjs transpilation process.
     *
     * What we really should do is (1) to propose a PR to citeproc-plus
     * to add styles at runtime or to somehow get our style in there, (2) to propose
     * a PR to django-npm-mjs to include json files in their transpile command.
     */
    if (!csl || !config.citationStyleLocation || !config.citationStyleKey) {
        return Promise.resolve()
    }
    return csl.getStyle(config.citationStyleKey).then((response) => {
        if (response?.wasInjected) {
            return Promise.resolve()
        }
        return fetch(staticUrl(config.citationStyleLocation), {method: "GET"})
            .then((response) => response.json())
            .then((response) => {
                Object.keys(csl.styles).forEach((styleLocation) => {
                    if (csl.styles[styleLocation][config.citationStyleKey]) {
                        csl.styles[styleLocation][config.citationStyleKey] = response
                        csl.styles[styleLocation][config.citationStyleKey].wasInjected = true
                    }
                })
            })
    })
}
