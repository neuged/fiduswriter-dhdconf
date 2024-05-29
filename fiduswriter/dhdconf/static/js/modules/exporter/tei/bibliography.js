import {wrap} from './utils'
import {text} from './convert'


function name(pers) {
    return wrap('name',
        wrap('surname',
            pers.family.map(text).join('')) + wrap('forename', pers.given.map(text).join(''))
    )
}


function biblItem(item) {
    const f = item.fields
    const authors = f.author?.map(a => wrap('author', name(a))).join('') || ''
    let title = f.title?.filter(it => it.type === 'text')
        .map(t => text(t))
        .join('')
    title = title ? wrap('title', title) : ''
    const date = f.date ? wrap('date', f.date, {when: f.date}) : ''
    const doi = f.doi ? wrap('idno', f.doi, {type: 'DOI'}) : ''
    const url = f.url ? wrap('ref', f.url, {target: f.url}) : ''
    const isbn = f.isbn ? wrap('idno', f.isbn.map(t => text(t)).join(''), {type: 'ISBN'}) : ''
    const issn = f.issn ? wrap('idno', f.issn.map(t => text(t)).join(''), {type: 'ISSN'}) : ''
    const journaltitle = f.journaltitle
        ? wrap('title', f.journaltitle.map(t => text(t)).join(''), {level: 'j'})
        : ''
    const issue = f.issue
        ? wrap('biblScope', f.issue.map(t => text(t)).join(''), {unit: 'issue'})
        : ''
    let editors = f.editor?.map(pers => wrap('editor', name(pers))).join('') || ''
    editors += f.editora?.map(pers => wrap('editor', name(pers))).join('') || ''
    let publisher = f.publisher?.map(p => {
        return p.filter(it => it.type === 'text')
            .map(t => text(t))
            .join('')
    }).join('')
    publisher = publisher ? wrap('publisher', publisher) : ''
    const edition = f.edition ? wrap('edition', f.edition.map(t => text(t)).join('')) : ''
    const place = f.location
        ? wrap('pubPlace', f.location.map(a => a.map(t => text(t)).join('')).join(''))
        : ''
    const content = [authors, title, date, doi, url, isbn, issn, journaltitle, issue,
        edition, editors, publisher, place].filter(c => c !== '').join('\n')
    return content ? wrap('bibl', content) : ''
}

function bibliography(bibDB) {
    const head = wrap('head', 'Bibliographie')
    const items = Object.values(bibDB.db).map(item => biblItem(item)).join('\n')
    return wrap('div',
        wrap('listBibl', `${head}\n${items}`),
        {type: 'bibliography'}
    )
}

export {name, biblItem}
export default bibliography