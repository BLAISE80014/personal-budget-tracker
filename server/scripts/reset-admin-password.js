import 'dotenv/config'
import { timingSafeEqual } from 'node:crypto'
import mongoose from 'mongoose'
import { connectDatabase } from '../config/db.js'
import { resetAdminPassword } from '../utils/admin-password.js'

function readHidden(prompt) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    throw new Error('Run this command in an interactive terminal so the new password can be hidden.')
  }

  process.stdout.write(prompt)
  return new Promise((resolve, reject) => {
    let value = ''
    const input = process.stdin
    const cleanup = () => {
      input.removeListener('data', onData)
      input.setRawMode(false)
      input.pause()
      process.stdout.write('\n')
    }
    const onData = (chunk) => {
      for (const character of chunk.toString('utf8')) {
        if (character === '\u0003') {
          cleanup()
          reject(new Error('Password reset cancelled.'))
          return
        }
        if (character === '\r' || character === '\n') {
          cleanup()
          resolve(value)
          return
        }
        if (character === '\u007f' || character === '\b') {
          value = value.slice(0, -1)
        } else if (character >= ' ') {
          value += character
        }
      }
    }

    input.setRawMode(true)
    input.resume()
    input.on('data', onData)
  })
}

async function main() {
  if (!process.env.ADMIN_EMAIL) {
    throw new Error('ADMIN_EMAIL environment variable is required.')
  }
  await connectDatabase(process.env.MONGODB_URI)

  const password = await readHidden('New administrator password: ')
  const confirmation = await readHidden('Confirm new administrator password: ')
  const passwordBuffer = Buffer.from(password)
  const confirmationBuffer = Buffer.from(confirmation)
  const matches = passwordBuffer.length === confirmationBuffer.length &&
    timingSafeEqual(passwordBuffer, confirmationBuffer)
  passwordBuffer.fill(0)
  confirmationBuffer.fill(0)
  if (!matches) throw new Error('Passwords do not match. No password was changed.')

  await resetAdminPassword(process.env.ADMIN_EMAIL, password)
  console.log('Administrator password updated. Existing sessions have been signed out.')
}

try {
  await main()
} catch (error) {
  console.error(`Administrator password reset failed: ${error.message}`)
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}
