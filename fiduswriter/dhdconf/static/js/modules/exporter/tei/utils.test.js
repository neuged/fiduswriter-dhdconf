import {tag, wrap, linkify, linkRef, linkPtr, wrapText} from "./utils"


test('create empty <br /> tag', () => {
    expect(tag('br')).toBe('<br />')
})

test('create empty ref tag with attributes', () => {
    expect(tag('ref', {n: 1, target: 'ftn1'})).toBe('<ref n="1" target="ftn1" />')
})

test('wrap text in p tag', () => {
    expect(wrap('p', 'hello')).toBe('<p>hello</p>')
})

test('wrapText escapes xml', () => {
    expect(wrapText('p', '<p/>')).toBe('<p>&lt;p/&gt;</p>')
})

test('wrap with attributes', () => {
    expect(wrap('hi', 'hello', {rend: 'italic'})).toBe('<hi rend="italic">hello</hi>')
})

test('link ref', () => {
    expect(linkRef('http://example.com', "text")).toBe('<ref target="http://example.com">text</ref>')
})

test('link ptr', () => {
    expect(linkPtr('http://example.com')).toBe('<ptr target="http://example.com" />')
})

test('linkify http', () => {
    expect(linkify('pre http://example.com/123 post'))
        .toBe('pre <ptr target="http://example.com/123" /> post')
})

test('linkify https', () => {
    expect(linkify('pre https://example.com/123 post'))
        .toBe('pre <ptr target="https://example.com/123" /> post')
})

test('linkify preserves trailing punctuation', () => {
    expect(linkify('https://example.com/123.'))
        .toBe('<ptr target="https://example.com/123" />.')
})

test('linkify transforms doi', () => {
    expect(linkify('pre doi:10.1000/182 post'))
        .toBe('pre <ref target="https://doi.org/10.1000/182">doi:10.1000/182</ref> post')
})

test('linkify preserves trailing punctuation on doi', () => {
    expect(linkify('doi:10.1000/182, post'))
        .toBe('<ref target="https://doi.org/10.1000/182">doi:10.1000/182</ref>, post')
})

test('linkify gracefully handles dois given as links', () => {
    expect(linkify('doi:https://doi.org/10.1000/182'))
        .toBe('doi:<ptr target="https://doi.org/10.1000/182" />')
})
