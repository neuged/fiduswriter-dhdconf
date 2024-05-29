import {tag, wrap} from "./utils"


test('create empty <br /> tag', () => {
    expect(tag('br')).toBe('<br />')
})

test('create empty ref tag with attributes', () => {
    expect(tag('ref', {n: 1, target: 'ftn1'})).toBe('<ref n="1" target="ftn1" />')
})

test('wrap text in p tag', () => {
    expect(wrap('p', 'hello')).toBe('<p>hello</p>')
})

test('wrap with attributes', () => {
    expect(wrap('hi', 'hello', {rend: 'italic'})).toBe('<hi rend="italic">hello</hi>')
})
