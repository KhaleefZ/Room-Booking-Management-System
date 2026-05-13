/**
 * Verhoeff Algorithm for Aadhaar Validation (JavaScript Implementation)
 */
const d = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const p = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 1, 4, 6, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

/**
 * Validates Aadhaar string using Verhoeff algorithm
 * @param {string} aadhaar 
 * @returns {boolean}
 */
export const validateAadhaar = (aadhaar) => {
  if (!/^\d{12}$/.test(aadhaar)) return false;
  if (aadhaar[0] === '0' || aadhaar[0] === '1') return false;

  let c = 0;
  let inverted = aadhaar.split('').reverse().map(Number);

  for (let i = 0; i < inverted.length; i++) {
    c = d[c][p[i % 8][inverted[i]]];
  }

  return c === 0;
};

/**
 * Validates PAN
 * @param {string} pan 
 * @returns {boolean}
 */
export const validatePAN = (pan) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase());

/**
 * Validates Indian Passport
 * @param {string} passport 
 * @returns {boolean}
 */
export const validatePassport = (passport) => /^[A-Z][1-9]\d{6}$/.test(passport.toUpperCase());
