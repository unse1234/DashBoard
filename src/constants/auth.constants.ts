// Mirrors the API's password policy; the server remains the source of truth.
export const PASSWORD_MIN_LENGTH = 12

export const PASSWORD_MAX_LENGTH = 128

export const PASSWORD_HINT = `At least ${PASSWORD_MIN_LENGTH} characters, with a lowercase letter, an uppercase letter and a number.`
