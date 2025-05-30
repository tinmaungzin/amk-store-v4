import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // For GCM, this is always 16
const SALT_LENGTH = 32

/**
 * Encrypts a game code using AES-256-GCM
 * @param text - The game code to encrypt
 * @param password - The encryption password (from environment variable)
 * @returns Encrypted string in format: salt:iv:tag:encrypted
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
    
    // Create cipher with IV
    const cipher = crypto.createCipher(ALGORITHM, key)
    cipher.setAAD(Buffer.from('game-code', 'utf8'))
    
    // Encrypt
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    // Get authentication tag
    const tag = cipher.getAuthTag()
    
    // Combine salt:iv:tag:encrypted
    return [
      salt.toString('hex'),
      iv.toString('hex'),
      tag.toString('hex'),
      encrypted
    ].join(':')
    
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt game code')
  }
}

/**
 * Decrypts a game code using AES-256-GCM
 * @param encryptedText - The encrypted string in format: salt:iv:tag:encrypted
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
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted game code format')
    }

    const [saltHex, , tagHex, encrypted] = parts
    
    // Convert hex strings back to buffers
    const salt = Buffer.from(saltHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')
    
    // Recreate key from password and salt
    const key = crypto.pbkdf2Sync(encryptionKey, salt, 100000, 32, 'sha256')
    
    // Create decipher
    const decipher = crypto.createDecipher(ALGORITHM, key)
    decipher.setAuthTag(tag)
    decipher.setAAD(Buffer.from('game-code', 'utf8'))
    
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