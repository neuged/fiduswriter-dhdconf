
/* cf. exporter/docx/math.js */
export class TeiExporterMath {

    constructor() {
        this.mathLive = null
    }

    init() {
        // dynamic import needed to not break jest as mathlive expects browser context
        return import("mathlive").then(
            MathLive => this.mathLive = MathLive
        )
    }

    latexToMathML(latex) {
        const mathml = this.mathLive.convertLatexToMathMl(latex)
            .replace(/&InvisibleTimes;/g, "&#8290;")
            .replace(/&ApplyFunction;/g, "&#x2061;")
            .replace(/&PlusMinus;/g, "&#177;")
            .replace(/&times;/g, "&#215;")
            .replace(/&x2061;/g, "&#x2061;")
        return `<math xmlns="http://www.w3.org/1998/Math/MathML">${mathml}</math>`
    }
}
