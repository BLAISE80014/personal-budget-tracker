import { z } from 'zod'
import AdminActivity from '../models/AdminActivity.js'
import AdminProvisioning from '../models/AdminProvisioning.js'
import User from '../models/User.js'

const emailSchema = z.string().trim().email().max(254)

export async function migrateMissingUserRoles() {
  return User.updateMany(
    { role: { $exists: false } },
    { $set: { role: 'user' } },
  )
}

export async function provisionInitialAdmin(emailValue) {
  const result = emailSchema.safeParse(emailValue)
  if (!result.success) throw new Error('Provide the email address of an existing account.')
  const email = result.data.toLowerCase()
  const user = await User.findOne({ email }).select('_id email role')
  if (!user) throw new Error('No existing account was found for that email address.')

  const setup = await AdminProvisioning.findById('initial-admin')
  if (user.role === 'admin') {
    if (setup && String(setup.userId) === String(user._id) && setup.status === 'completed') {
      return { email, alreadyProvisioned: true }
    }
    throw new Error('This account is already an administrator but is not the recorded initial admin. No account was changed.')
  }
  if (await User.exists({ role: 'admin' })) {
    throw new Error('A different administrator already exists. Use the explicit admin migration command to change accounts.')
  }

  let reservation
  try {
    reservation = await AdminProvisioning.findOneAndUpdate(
      { _id: 'initial-admin' },
      { $setOnInsert: { userId: user._id, email } },
      { upsert: true, returnDocument: 'after', runValidators: true },
    )
  } catch (error) {
    if (error.code !== 11000) throw error
    reservation = await AdminProvisioning.findById('initial-admin')
  }

  if (!reservation || String(reservation.userId) !== String(user._id)) {
    throw new Error('Initial administrator setup has already been reserved for another account.')
  }
  if (reservation.status === 'completed') {
    throw new Error('Initial administrator setup has already been completed. No account was changed.')
  }

  const updated = await User.updateOne(
    { _id: user._id, role: { $ne: 'admin' } },
    { $set: { role: 'admin' } },
    { runValidators: true },
  )
  if (updated.modifiedCount !== 1) {
    throw new Error('The account role changed during setup. No administrator was provisioned.')
  }
  await AdminProvisioning.updateOne(
    { _id: 'initial-admin', status: 'reserved' },
    { $set: { status: 'completed' } },
  )

  return { email, alreadyProvisioned: false }
}

async function reserveMigration(sourceUser, targetUser, destinationEmail) {
  try {
    return await AdminProvisioning.findOneAndUpdate(
      { _id: 'admin-email-migration' },
      {
        $setOnInsert: {
          userId: targetUser._id,
          sourceUserId: sourceUser._id,
          email: destinationEmail,
          status: 'migrating',
        },
      },
      { upsert: true, returnDocument: 'after', runValidators: true },
    )
  } catch (error) {
    if (error.code !== 11000) throw error
    return AdminProvisioning.findById('admin-email-migration')
  }
}

async function recordMigrationActivity({ eventKey, actor, target, previousRole, nextRole }) {
  return AdminActivity.findOneAndUpdate(
    { eventKey },
    {
      $setOnInsert: {
        actorId: actor._id,
        actorEmail: actor.email,
        targetUserId: target._id,
        targetEmail: target.email,
        previousRole,
        nextRole,
        status: 'pending',
        eventKey,
      },
    },
    { upsert: true, returnDocument: 'after', runValidators: true },
  )
}

export async function migrateInitialAdmin(sourceEmailValue, destinationEmailValue) {
  const sourceResult = emailSchema.safeParse(sourceEmailValue)
  const destinationResult = emailSchema.safeParse(destinationEmailValue)
  if (!sourceResult.success || !destinationResult.success) {
    throw new Error('Both the existing administrator email and ADMIN_EMAIL must be valid email addresses.')
  }

  const sourceEmail = sourceResult.data.toLowerCase()
  const destinationEmail = destinationResult.data.toLowerCase()
  if (sourceEmail === destinationEmail) {
    throw new Error('The existing administrator and ADMIN_EMAIL are the same. No migration is needed.')
  }

  const [sourceUser, targetUser] = await Promise.all([
    User.findOne({ email: sourceEmail }).select('_id email role'),
    User.findOne({ email: destinationEmail }).select('_id email role'),
  ])
  if (!sourceUser) throw new Error('The specified source administrator account does not exist.')
  if (!targetUser) throw new Error('ADMIN_EMAIL must belong to an existing account. No account was changed.')

  let migration = await AdminProvisioning.findById('admin-email-migration')
  if (migration?.status === 'completed') {
    throw new Error('The administrator email migration has already been completed. No account was changed.')
  }

  if (!migration) {
    if (sourceUser.role !== 'admin') {
      throw new Error('The specified source account is not an existing administrator. No account was changed.')
    }
    const [adminCount, initialSetup] = await Promise.all([
      User.countDocuments({ role: 'admin' }),
      AdminProvisioning.findById('initial-admin').select('userId').lean(),
    ])
    if (adminCount !== 1 || !initialSetup || String(initialSetup.userId) !== String(sourceUser._id)) {
      throw new Error('The database does not have one matching provisioned administrator. No account was changed.')
    }
    if (targetUser.role !== 'user') {
      throw new Error('ADMIN_EMAIL must belong to a regular user account. No account was changed.')
    }
    migration = await reserveMigration(sourceUser, targetUser, destinationEmail)
  }

  if (
    !migration ||
    String(migration.sourceUserId) !== String(sourceUser._id) ||
    String(migration.userId) !== String(targetUser._id)
  ) {
    throw new Error('A different administrator migration is already in progress. No account was changed.')
  }
  if (!['admin', 'user'].includes(sourceUser.role) || !['admin', 'user'].includes(targetUser.role)) {
    throw new Error('Account roles do not match an administrator migration. No account was changed.')
  }

  const migrationKey = `admin-email-migration:${sourceUser._id}:${targetUser._id}`
  const promoteActivity = await recordMigrationActivity({
    eventKey: `${migrationKey}:promote`,
    actor: sourceUser,
    target: targetUser,
    previousRole: 'user',
    nextRole: 'admin',
  })
  const promote = await User.updateOne(
    { _id: targetUser._id, role: 'user' },
    { $set: { role: 'admin' } },
    { runValidators: true },
  )
  if (promote.modifiedCount !== 1 && !(await User.exists({ _id: targetUser._id, role: 'admin' }))) {
    await AdminActivity.updateOne({ _id: promoteActivity._id }, { $set: { status: 'failed' } })
    throw new Error('The configured account could not be promoted. Migration remains resumable; no account was deleted.')
  }

  const initialSetup = await AdminProvisioning.findById('initial-admin')
  if (!initialSetup || ![String(sourceUser._id), String(targetUser._id)].includes(String(initialSetup.userId))) {
    throw new Error('The initial administrator marker does not match this migration. The migration remains resumable.')
  }
  await AdminProvisioning.updateOne(
    { _id: 'initial-admin' },
    { $set: { userId: targetUser._id, email: destinationEmail, status: 'completed' } },
  )

  const demoteActivity = await recordMigrationActivity({
    eventKey: `${migrationKey}:demote`,
    actor: sourceUser,
    target: sourceUser,
    previousRole: 'admin',
    nextRole: 'user',
  })
  const demote = await User.updateOne(
    { _id: sourceUser._id, role: 'admin' },
    { $set: { role: 'user' } },
    { runValidators: true },
  )
  if (demote.modifiedCount !== 1 && !(await User.exists({ _id: sourceUser._id, role: 'user' }))) {
    await AdminActivity.updateOne({ _id: demoteActivity._id }, { $set: { status: 'failed' } })
    throw new Error('The previous administrator could not be demoted. Migration remains resumable.')
  }

  await Promise.all([
    AdminActivity.updateOne({ _id: promoteActivity._id }, { $set: { status: 'completed' } }),
    AdminActivity.updateOne({ _id: demoteActivity._id }, { $set: { status: 'completed' } }),
    AdminProvisioning.updateOne(
      { _id: 'admin-email-migration', status: 'migrating' },
      { $set: { status: 'completed' } },
    ),
  ])

  return { migrated: true }
}
