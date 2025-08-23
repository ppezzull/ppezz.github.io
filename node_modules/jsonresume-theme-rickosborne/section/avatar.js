const h = require('../fn/htmlEscape');

module.exports = function renderAvatar(resume) {
    const basics = resume.basics || {};
    if (basics.image) {
        return `<img src="${h(basics.image)}" id="avatar" alt="${h(basics.name)}">`
    }
    return '';
}
