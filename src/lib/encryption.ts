const crypto = require('crypto')

const ALGORITHM = 'aes-256-cbc'
const IV_LENGTH = 16
const SALT_LENGTH = 32

/**
 * Encrypts a game code using AES-256-CBC
 * @param text - The game code to encrypt
 * @param password - The encryption password (from environment variable)
 * @returns Encrypted string in format: salt:iv:encrypted
 * @throws Error if encryption fails
 */
export function encryptGameCode(text: string, password?: string): string {
  try {
    const encryptionKey = password || process.env.ENCRYPTION_KEY
    
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required')
    }

    if (encryptionKey.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be exactly 32 characters long')
    }

    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH)
    const iv = crypto.randomBytes(IV_LENGTH)
    
    // Create key from password and salt
    const key = crypto.pbkdf2Sync(encryptionKey, salt, 100000, 32, 'sha256')
    
    // Create cipher with key and IV
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    
    // Encrypt
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    // Combine salt:iv:encrypted
    return [
      salt.toString('hex'),
      iv.toString('hex'),
      encrypted
    ].join(':')
    
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt game code')
  }
}

/**
 * Decrypts a game code using AES-256-CBC
 * @param encryptedText - The encrypted string in format: salt:iv:encrypted
 * @param password - The encryption password (from environment variable)
 * @returns Decrypted game code
 * @throws Error if decryption fails
 */
export function decryptGameCode(encryptedText: string, password?: string): string {
  try {
    const encryptionKey = password || process.env.ENCRYPTION_KEY
    
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required')
    }

    if (encryptionKey.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be exactly 32 characters long')
    }

    // Split the encrypted string
    const parts = encryptedText.split(':')
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted game code format')
    }

    const [saltHex, ivHex, encrypted] = parts
    
    // Convert hex strings back to buffers
    const salt = Buffer.from(saltHex, 'hex')
    const iv = Buffer.from(ivHex, 'hex')
    
    // Recreate key from password and salt
    const key = crypto.pbkdf2Sync(encryptionKey, salt, 100000, 32, 'sha256')
    
    // Create decipher with key and IV
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    
    // Decrypt
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
    
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt game code')
  }
}

/**
 * Generates a random encryption key for game codes
 * @returns 32-character random string suitable for ENCRYPTION_KEY
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(16).toString('hex')
}

/**
 * Validates if an encryption key is properly formatted
 * @param key - The encryption key to validate
 * @returns Boolean indicating if key is valid
 */
export function validateEncryptionKey(key: string): boolean {
  return typeof key === 'string' && key.length === 32
} 