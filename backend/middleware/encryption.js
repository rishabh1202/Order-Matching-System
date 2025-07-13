const crypto = require('crypto');
const NodeRSA = require('node-rsa');
const { exec } = require('child_process');
const winston = require('winston');

// RSA key pair generation (in production, these should be stored securely)
let privateKey, publicKey;

// Initialize RSA keys
function initializeRSAKeys() {
  try {
    // Generate RSA key pair
    const key = new NodeRSA({ b: 2048 });
    privateKey = key.exportKey('private');
    publicKey = key.exportKey('public');
    
    winston.info('RSA keys generated successfully');
  } catch (error) {
    winston.error('Error generating RSA keys:', error);
    throw error;
  }
}

// Initialize keys on module load
initializeRSAKeys();

// Node.js decryption function
function decryptWithNodeJS(encryptedData) {
  try {
    const key = new NodeRSA(privateKey);
    key.setOptions({ encryptionScheme: 'pkcs1' });
    
    const decrypted = key.decrypt(encryptedData, 'utf8');
    return JSON.parse(decrypted);
  } catch (error) {
    winston.warn('Node.js decryption failed, trying OpenSSL fallback:', error.message);
    return null;
  }
}

// OpenSSL fallback decryption
function decryptWithOpenSSL(encryptedData) {
  return new Promise((resolve, reject) => {
    // Create temporary files for OpenSSL
    const crypto = require('crypto');
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    
    const tempDir = os.tmpdir();
    const encryptedFile = path.join(tempDir, `encrypted_${Date.now()}.bin`);
    const decryptedFile = path.join(tempDir, `decrypted_${Date.now()}.txt`);
    const privateKeyFile = path.join(tempDir, `private_${Date.now()}.pem`);
    
    try {
      // Write encrypted data to file
      fs.writeFileSync(encryptedFile, Buffer.from(encryptedData, 'base64'));
      
      // Write private key to file
      fs.writeFileSync(privateKeyFile, privateKey);
      
      // OpenSSL command for decryption
      const opensslCommand = `openssl rsautl -decrypt -inkey "${privateKeyFile}" -in "${encryptedFile}" -out "${decryptedFile}"`;
      
      exec(opensslCommand, (error, stdout, stderr) => {
        try {
          // Clean up temporary files
          fs.unlinkSync(encryptedFile);
          fs.unlinkSync(privateKeyFile);
          
          if (error) {
            winston.error('OpenSSL decryption failed:', error);
            reject(new Error('OpenSSL decryption failed'));
            return;
          }
          
          // Read decrypted data
          const decryptedData = fs.readFileSync(decryptedFile, 'utf8');
          fs.unlinkSync(decryptedFile);
          
          const parsed = JSON.parse(decryptedData);
          resolve(parsed);
          
        } catch (cleanupError) {
          winston.warn('Error cleaning up temporary files:', cleanupError);
          resolve(null);
        }
      });
      
    } catch (fileError) {
      winston.error('Error creating temporary files for OpenSSL:', fileError);
      reject(fileError);
    }
  });
}

// Main decryption function with fallback
async function decryptData(encryptedData) {
  // Try Node.js decryption first
  let decrypted = decryptWithNodeJS(encryptedData);
  
  if (decrypted) {
    return decrypted;
  }
  
  // Fallback to OpenSSL
  try {
    decrypted = await decryptWithOpenSSL(encryptedData);
    if (decrypted) {
      winston.info('Successfully decrypted using OpenSSL fallback');
      return decrypted;
    }
  } catch (error) {
    winston.error('Both Node.js and OpenSSL decryption failed:', error);
  }
  
  throw new Error('Decryption failed with both methods');
}

// Encryption middleware
const encryptionMiddleware = async (req, res, next) => {
  // Skip encryption for GET requests
  if (req.method === 'GET') {
    return next();
  }
  
  try {
    // Check if request body contains encrypted data
    if (req.body && req.body.encryptedData) {
      const decryptedData = await decryptData(req.body.encryptedData);
      req.body = decryptedData;
      winston.info('Request decrypted successfully');
    }
    
    next();
  } catch (error) {
    winston.error('Encryption middleware error:', error);
    res.status(400).json({ 
      error: 'Invalid encrypted data',
      message: 'Failed to decrypt request data'
    });
  }
};

// Function to get public key for frontend
function getPublicKey() {
  return publicKey;
}

// Function to encrypt data (for testing purposes)
function encryptData(data) {
  try {
    const key = new NodeRSA(publicKey);
    key.setOptions({ encryptionScheme: 'pkcs1' });
    
    const jsonData = JSON.stringify(data);
    const encrypted = key.encrypt(jsonData, 'base64');
    return encrypted;
  } catch (error) {
    winston.error('Error encrypting data:', error);
    throw error;
  }
}

module.exports = encryptionMiddleware;
module.exports.getPublicKey = getPublicKey;
module.exports.encryptData = encryptData; 