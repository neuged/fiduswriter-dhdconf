/** @jest-environment jsdom */

jest.mock("mathlive", () => undefined, {virtual: true})
jest.mock("../../common", () => ({escapeText: (text) => text}))

import "./patcher"
import {HTMLExporterConvert} from "./convert"

test("collect orcids", () => {
    const instance = new HTMLExporterConvert(undefined, undefined, {
        attrs: {
            id: "orcidIds"
        },
        content: [
            {attrs: {tag: "0000-0000-0000-0000"}},
            {attrs: {tag: "<ORCID: N/A>"}}
        ],
        type: "tags_part"
    })

    jest.spyOn(instance, "analyze")
    jest.spyOn(instance, "process").mockImplementation()
    instance.init()

    expect(instance.analyze).toHaveBeenCalled()
    expect(instance.process).toHaveBeenCalled()
    expect(instance.orcidIds).toStrictEqual(["0000-0000-0000-0000", null])
})

test("render empty title node", () => {
    const instance = new HTMLExporterConvert()

    expect(instance.walkJson({type: "title"})).toStrictEqual("")
})

test("render orcid parts", () => {
    const instance = new HTMLExporterConvert()

    expect(instance.walkJson({
        attrs: {
            id: "orcidIds"
        },
        type: "tags_part"
    })).toStrictEqual("")
})

test("render contributor without affiliation and without orcid", () => {
    const instance = new HTMLExporterConvert(undefined, undefined, {
        type: undefined
    })

    jest.spyOn(instance, "analyze")
    jest.spyOn(instance, "process").mockImplementation()
    instance.init()

    expect(instance.analyze).toHaveBeenCalled()
    expect(instance.process).toHaveBeenCalled()
    expect(instance.walkJson({
        attrs: {
            id: "id"
        },
        content: [{
            attrs: {
                firstname: "contrib",
                lastname: "utor"
            }
        }],
        type: "contributors_part"
    })).toStrictEqual(
        '<div class="doc-part doc-contributors doc-id other" id="id">' +
            '<span id="id-0" class="person">' +
                '<span class="name">' +
                    '<span class="firstname">contrib</span> ' +
                    '<span class="lastname">utor</span>' +
                '</span>' +
            '</span>' +
        '</div>'
    )
})

test("render contributor with affiliation and without orcid", () => {
    const instance = new HTMLExporterConvert(undefined, undefined, {
        type: undefined
    })

    jest.spyOn(instance, "analyze")
    jest.spyOn(instance, "process").mockImplementation()
    instance.init()

    expect(instance.analyze).toHaveBeenCalled()
    expect(instance.process).toHaveBeenCalled()
    expect(instance.walkJson({
        attrs: {
            id: "id"
        },
        content: [{
            attrs: {
                firstname: "contrib",
                lastname: "utor",
                institution: "inst"
            }
        }],
        type: "contributors_part"
    })).toStrictEqual(
        '<div class="doc-part doc-contributors doc-id other" id="id">' +
            '<span id="id-0" class="person">' +
                '<span class="name">' +
                    '<span class="firstname">contrib</span> ' +
                    '<span class="lastname">utor</span>' +
                '</span>' +
                '<span> (' +
                    '<span>inst</span>' +
                ')</span>' +
            '</span>' +
        '</div>'
    )
})

test("render contributor with affiliation and with orcid", () => {
    const instance = new HTMLExporterConvert(undefined, undefined, {
        attrs: {
            id: "orcidIds"
        },
        content: [
            {attrs: {tag: "0000-0000-0000-0000"}}
        ],
        type: "tags_part"
    })

    jest.spyOn(instance, "analyze")
    jest.spyOn(instance, "process").mockImplementation()
    instance.init()

    expect(instance.analyze).toHaveBeenCalled()
    expect(instance.process).toHaveBeenCalled()
    expect(instance.orcidIds).toStrictEqual(["0000-0000-0000-0000"])
    expect(instance.walkJson({
        attrs: {
            id: "id"
        },
        content: [{
            attrs: {
                firstname: "contrib",
                lastname: "utor",
                institution: "inst"
            }
        }],
        type: "contributors_part"
    })).toStrictEqual(
        '<div class="doc-part doc-contributors doc-id other" id="id">' +
            '<span id="id-0" class="person">' +
                '<span class="name">' +
                    '<span class="firstname">contrib</span> ' +
                    '<span class="lastname">utor</span>' +
                '</span>' +
                '<span> (' +
                    '<span>inst</span>; ' +
                    '<a href="https://orcid.org/0000-0000-0000-0000">' +
                        'orcid.org/0000-0000-0000-0000' +
                    '</a>' +
                ')</span>' +
            '</span>' +
        '</div>'
    )
})
