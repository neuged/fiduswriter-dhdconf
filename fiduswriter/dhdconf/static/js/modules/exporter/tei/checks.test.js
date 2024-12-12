import {config} from "../../dhdconf/config"
import {checkAbstractWords, DocumentCheckFailed} from "./checks"

const abstract = (text) => ({
    content: [{
        type: "paragraph",
        content: [{
            type: "text",
            text: text
        }
        ]}
    ]})

beforeAll(() => {
    config.teiExportMaxWordsInAbstract = 5
})

test("abstract check does not throw on short abstract", () => {
    expect(
        () => checkAbstractWords(abstract("short abstract"))
    ).not.toThrow(DocumentCheckFailed)
})

test("abstract check does throw on long abstract", () => {
    expect(
        () => checkAbstractWords(abstract("longer abstract with many w o r d s"))
    ).toThrow(DocumentCheckFailed)
})
