const validator = require('validator');

const sanitize = (str) => {
    let temp = str.trim();
    temp = validator.stripLow(temp);
    temp = validator.escape(temp);
    return temp;
};

module.exports = sanitize;
