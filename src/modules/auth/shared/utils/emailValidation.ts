const EMAIL_NO_WHITESPACE_PATTERN = /^\S+$/;
const EMAIL_STRICT_PATTERN = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const EMAIL_NO_WHITESPACE_MESSAGE = 'Email must not contain whitespace.';
export const EMAIL_INVALID_CHARACTERS_MESSAGE = 'Invalid email address.';

export const hasEmailWhitespace = (email: string) =>
  !EMAIL_NO_WHITESPACE_PATTERN.test(email);

export const hasEmailInvalidCharacters = (email: string) =>
  !EMAIL_STRICT_PATTERN.test(email);

export const validateEmailHasNoWhitespace = (email: string): string | null =>
  hasEmailWhitespace(email) ? EMAIL_NO_WHITESPACE_MESSAGE : null;

export const validateEmail = (email: string): string | null => {
  if (!email) return 'Email cannot be empty.';
  if (hasEmailWhitespace(email)) return EMAIL_NO_WHITESPACE_MESSAGE;
  if (hasEmailInvalidCharacters(email)) return EMAIL_INVALID_CHARACTERS_MESSAGE;
  return null;
};
