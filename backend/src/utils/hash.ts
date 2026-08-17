import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

/**
 * Hashes a plaintext password using bcrypt.
 * @param password Plain text password
 * @returns Hashed password string
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compares a plaintext password against a stored bcrypt hash.
 * @param password Plain text password
 * @param hash Stored bcrypt hash
 * @returns True if password matches, otherwise false
 */
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
