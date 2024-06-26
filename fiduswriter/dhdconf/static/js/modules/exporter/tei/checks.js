
import {textContent} from "../tools/doc_content";
import {config} from "../../dhdconf/config";


export class DocumentCheckFailed extends Error {
  constructor(message) {
    super(message);
    this.name = 'DocumentCheckFailed';
  }
}

export function checkAbstractWords(data) {
    const n = config.teiExportMaxWordsInAbstract
    if (textContent(data)?.split(/\s+/).length > n) {
        throw new DocumentCheckFailed(`Abstract exceeds ${n} words`);
    }
}

export function runChecks(fields) {
    if (fields.abstract && config.teiExportMaxWordsInAbstract > -1) {
        checkAbstractWords(fields.abstract)
    }
}
