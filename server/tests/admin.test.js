import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { once } from 'node:events'
import { randomUUID } from 'node:crypto'

const testUri = process.env.TEST_MONGODB_URI

if (!testUri) {
  test('admin integration tests require TEST_MONGODB_URI', { skip: 'Set TEST_MONGODB_URI to a dedicated test database.' }, () => {})
} else {
  const databaseName = decodeURIComponent(new URL(testUri).pathname.slice(1))
  if (!/(^|[-_])test($|[-_])/i.test(databaseName)) {
    throw new Error('TEST_MONGODB_URI must use a database name containing "test".')
  }

  process.env.JWT_SECRET ||= randomUUID()
  const mongoose = (await import('mongoose')).default
  const bcrypt = (await import('bcryptjs')).default
  const { default: app } = await import('../app.js')
  const User = (await import('../models/User.js')).default
  const AdminActivity = (await import('../models/AdminActivity.js')).default
  const AdminNotification = (await import('../models/AdminNotification.js')).default
  const AdminProvisioning = (await import('../models/AdminProvisioning.js')).default
  const { trackerRecordModels } = await import('../models/TrackerRecords.js')
  const { migrateMissingUserRoles, provisionInitialAdmin } = await import('../utils/admin-provisioning.js')
  const emails = []
  const prefix = `admin-suite-${randomUUID()}`
  let sequence = 0
  let server
  let baseUrl
  let provisionedAdmin

  function newEmail() {
    const email = `${prefix}-${++sequence}@example.com`
    emails.push(email)
    return email
  }

  async function createAccount({ role = 'user' } = {}) {
    const email = newEmail()
    const password = `test-password-${sequence}`
    const passwordHash = await bcrypt.hash(password, 4)
    const user = await User.create({
      fullName: `Test User ${sequence}`,
      email,
      role,
      phone: `555-${sequence}`,
      passwordHash,
    })
    return { user, email, password, passwordHash }
  }

  async function request(path, { token, body, ...options } = {}) {
    const headers = { Accept: 'application/json' }
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    if (token) headers.Authorization = `Bearer ${token}`
    return fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  }

  async function login(email, password, { admin = false } = {}) {
    const response = await request(`/api/auth/${admin ? 'admin/' : ''}login`, { method: 'POST', body: { email, password } })
    const payload = await response.json()
    assert.equal(response.status, 200, payload.error?.message)
    return payload.data
  }

  before(async () => {
    await mongoose.connect(testUri, { serverSelectionTimeoutMS: 5000 })
    server = app.listen(0, '127.0.0.1')
    await once(server, 'listening')
    baseUrl = `http://127.0.0.1:${server.address().port}`
  })

  after(async () => {
    if (server) {
      server.closeAllConnections()
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
    }
    if (mongoose.connection.readyState === 1) {
      const users = await User.find({ email: { $in: emails } }).select('_id').lean()
      const userIds = users.map((user) => user._id)
      await Promise.all([
        ...Object.values(trackerRecordModels).map((Model) => Model.deleteMany({ userId: { $in: userIds } })),
        AdminActivity.deleteMany({ $or: [{ actorId: { $in: userIds } }, { targetUserId: { $in: userIds } }] }),
        AdminNotification.deleteMany({ recipientId: { $in: userIds } }),
        AdminProvisioning.deleteMany({ userId: { $in: userIds } }),
        User.deleteMany({ _id: { $in: userIds } }),
      ])
      await mongoose.disconnect()
    }
  })

  test('public registration assigns the user role and rejects a client admin role', async () => {
    const email = newEmail()
    const rejected = await request('/api/auth/register', {
      method: 'POST',
      body: { fullName: 'Role Attack', email, password: 'test-password-123', role: 'admin' },
    })
    assert.equal(rejected.status, 400)
    assert.equal(await User.exists({ email }), null)

    const response = await request('/api/auth/register', {
      method: 'POST',
      body: { fullName: 'Regular Account', email, password: 'test-password-123' },
    })
    const payload = await response.json()
    assert.equal(response.status, 201)
    assert.equal(payload.data.user.role, 'user')

    const authenticated = await login(email, 'test-password-123')
    assert.equal(authenticated.user.role, 'user')
    const deniedAdminLogin = await request('/api/auth/admin/login', {
      method: 'POST',
      body: { email, password: 'test-password-123' },
    })
    assert.equal(deniedAdminLogin.status, 403)
  })

  test('missing roles migrate to user without changing existing account data', async () => {
    const account = await createAccount()
    await User.collection.updateOne({ _id: account.user._id }, { $unset: { role: '' } })

    await migrateMissingUserRoles()

    const updated = await User.findById(account.user._id).select('+passwordHash')
    assert.equal(updated.role, 'user')
    assert.equal(updated.passwordHash, account.passwordHash)
    assert.equal(updated.fullName, account.user.fullName)
    assert.equal(updated.phone, account.user.phone)
  })

  test('initial provisioning promotes only the selected existing account and cannot overwrite an admin', async () => {
    provisionedAdmin = await createAccount()
    const regularAccount = await createAccount()
    const originalHash = provisionedAdmin.user.passwordHash

    await provisionInitialAdmin(provisionedAdmin.email)

    const admin = await User.findById(provisionedAdmin.user._id).select('+passwordHash')
    const regular = await User.findById(regularAccount.user._id)
    assert.equal(admin.role, 'admin')
    assert.equal(admin.passwordHash, originalHash)
    assert.equal(regular.role, 'user')
    assert.equal(await User.countDocuments({ email: { $in: [provisionedAdmin.email, regularAccount.email] } }), 2)

    await assert.rejects(provisionInitialAdmin(regularAccount.email), /administrator already exists/)
    assert.equal((await User.findById(provisionedAdmin.user._id)).role, 'admin')
    assert.equal((await User.findById(regularAccount.user._id)).role, 'user')
  })

  test('regular users cannot use admin APIs or read other users’ financial records', async () => {
    const regularAccount = await createAccount()
    const otherAccount = await createAccount()
    const expenseModel = trackerRecordModels.expenses
    await expenseModel.create({
      id: randomUUID(),
      userId: otherAccount.user._id,
      date: '2026-01-01',
      description: 'Private expense',
      category: 'Private',
      amount: 50,
    })
    const regular = await login(regularAccount.email, regularAccount.password)

    const unauthenticatedOverview = await request('/api/admin/overview')
    assert.equal(unauthenticatedOverview.status, 401)

    const overview = await request('/api/admin/overview', { token: regular.token })
    assert.equal(overview.status, 403)
    const roleChange = await request(`/api/admin/users/${otherAccount.user._id}/role`, {
      method: 'PATCH',
      token: regular.token,
      body: { role: 'admin' },
    })
    assert.equal(roleChange.status, 403)

    const expenses = await request('/api/expenses', { token: regular.token })
    assert.equal(expenses.status, 200)
    assert.deepEqual((await expenses.json()).data.items, [])

    const profileChange = await request('/api/auth/profile', {
      method: 'PATCH',
      token: regular.token,
      body: { fullName: regular.user.fullName, email: regular.user.email, role: 'admin' },
    })
    assert.equal(profileChange.status, 400)
  })

  test('admin APIs support audited role changes and prevent self-demotion', async () => {
    const targetAccount = await createAccount()
    const regularLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: provisionedAdmin.email, password: provisionedAdmin.password },
    })
    assert.equal(regularLogin.status, 403)

    const admin = await login(provisionedAdmin.email, provisionedAdmin.password, { admin: true })
    assert.equal(admin.user.role, 'admin')

    const usersResponse = await request('/api/admin/users?limit=100', { token: admin.token })
    assert.equal(usersResponse.status, 200)
    const overview = (await usersResponse.json()).data
    const listed = overview.users.find((user) => user.id === String(targetAccount.user._id))
    assert.equal(listed.role, 'user')
    assert.equal('passwordHash' in listed, false)
    assert.equal(overview.users.find((user) => user.id === admin.user.id).protected, true)

    const promoted = await request(`/api/admin/users/${targetAccount.user._id}/role`, {
      method: 'PATCH',
      token: admin.token,
      body: { role: 'admin' },
    })
    assert.equal(promoted.status, 200)
    assert.equal((await promoted.json()).data.user.role, 'admin')
    assert.equal(await AdminActivity.countDocuments({ targetUserId: targetAccount.user._id, status: 'completed' }), 1)
    const notificationResponse = await request('/api/admin/notifications', { token: admin.token })
    assert.equal(notificationResponse.status, 200)
    const notifications = (await notificationResponse.json()).data
    assert.equal(notifications.unread, 1)
    const notificationId = notifications.notifications[0].id
    const markedRead = await request(`/api/admin/notifications/${notificationId}/read`, { method: 'PATCH', token: admin.token })
    assert.equal(markedRead.status, 200)
    assert.equal((await markedRead.json()).data.read, true)

    const secondAdmin = await login(targetAccount.email, targetAccount.password, { admin: true })
    const protectedAdminDemotion = await request(`/api/admin/users/${admin.user.id}/role`, {
      method: 'PATCH',
      token: secondAdmin.token,
      body: { role: 'user' },
    })
    assert.equal(protectedAdminDemotion.status, 400)
    assert.equal((await User.findById(provisionedAdmin.user._id)).role, 'admin')

    const demoted = await request(`/api/admin/users/${targetAccount.user._id}/role`, {
      method: 'PATCH',
      token: admin.token,
      body: { role: 'user' },
    })
    assert.equal(demoted.status, 200)

    const selfDemotion = await request(`/api/admin/users/${admin.user.id}/role`, {
      method: 'PATCH',
      token: admin.token,
      body: { role: 'user' },
    })
    assert.equal(selfDemotion.status, 400)

    const invalidRole = await request(`/api/admin/users/${targetAccount.user._id}/role`, {
      method: 'PATCH',
      token: admin.token,
      body: { role: 'owner' },
    })
    assert.equal(invalidRole.status, 400)
  })

  test('administrator analytics and record listings use aggregated MongoDB data', async () => {
    const today = new Date().toISOString().slice(0, 10)
    await Promise.all([
      trackerRecordModels.income.create({
        id: randomUUID(), userId: provisionedAdmin.user._id, date: today, source: 'Admin test income', amount: 1234,
      }),
      trackerRecordModels.expenses.create({
        id: randomUUID(), userId: provisionedAdmin.user._id, date: today, description: 'Admin test expense', category: 'Testing', amount: 234,
      }),
    ])
    const admin = await login(provisionedAdmin.email, provisionedAdmin.password, { admin: true })
    const [overviewResponse, analyticsResponse, recordsResponse, usersResponse] = await Promise.all([
      request('/api/admin/overview', { token: admin.token }),
      request('/api/admin/analytics?range=7', { token: admin.token }),
      request('/api/admin/records?type=all&search=Admin%20test', { token: admin.token }),
      request('/api/admin/users?search=Admin%20test', { token: admin.token }),
    ])
    assert.equal(overviewResponse.status, 200)
    assert.equal(analyticsResponse.status, 200)
    assert.equal(recordsResponse.status, 200)
    assert.equal(usersResponse.status, 200)
    const overview = (await overviewResponse.json()).data.summary
    assert.equal(overview.totalIncome, 1234)
    assert.equal(overview.totalExpenses, 284)
    assert.equal(overview.activeUsers, null)
    const analytics = (await analyticsResponse.json()).data
    assert.equal(analytics.series.length, 7)
    assert.equal(analytics.series.at(-1).income, 1234)
    assert.equal(analytics.series.at(-1).expenses, 234)
    const records = (await recordsResponse.json()).data.records
    assert.equal(records.length, 2)
    assert.ok(records.every((record) => record.owner.email === provisionedAdmin.email))
    assert.ok(records.every((record) => !('userId' in record)))
    assert.equal((await usersResponse.json()).data.total, 0)

    const regular = await createAccount()
    const userSession = await login(regular.email, regular.password)
    const restricted = await request('/api/admin/analytics?range=7', { token: userSession.token })
    assert.equal(restricted.status, 403)
  })

  test('administrator email migration is explicit, preserves accounts, and completes safely', async () => {
    const nextAdmin = await createAccount()
    const previousAdminHash = provisionedAdmin.user.passwordHash
    const nextAdminHash = nextAdmin.user.passwordHash

    const { migrateInitialAdmin } = await import('../utils/admin-provisioning.js')
    await migrateInitialAdmin(provisionedAdmin.email, nextAdmin.email)

    const oldAccount = await User.findById(provisionedAdmin.user._id).select('+passwordHash')
    const newAccount = await User.findById(nextAdmin.user._id).select('+passwordHash')
    const marker = await AdminProvisioning.findById('initial-admin')
    assert.equal(oldAccount.role, 'user')
    assert.equal(newAccount.role, 'admin')
    assert.equal(oldAccount.passwordHash, previousAdminHash)
    assert.equal(newAccount.passwordHash, nextAdminHash)
    assert.equal(String(marker.userId), String(nextAdmin.user._id))
    assert.equal(await User.countDocuments({ role: 'admin' }), 1)
    assert.equal(await AdminActivity.countDocuments({ eventKey: { $regex: '^admin-email-migration:' }, status: 'completed' }), 2)

    await assert.rejects(migrateInitialAdmin(provisionedAdmin.email, nextAdmin.email), /already been completed/)
    const oldTokenAccess = await request('/api/admin/overview', { token: (await login(provisionedAdmin.email, provisionedAdmin.password)).token })
    assert.equal(oldTokenAccess.status, 403)
  })

  test('local administrator password reset verifies role, preserves account, and revokes sessions', async () => {
    const account = await createAccount({ role: 'admin' })
    const previousVersion = account.user.tokenVersion
    const previousHash = account.user.passwordHash
    const session = await login(account.email, account.password, { admin: true })
    const { resetAdminPassword } = await import('../utils/admin-password.js')

    await resetAdminPassword(account.email, 'replacement-password-123')

    const updated = await User.findById(account.user._id).select('+passwordHash')
    assert.equal(updated.role, 'admin')
    assert.equal(updated.tokenVersion, previousVersion + 1)
    assert.notEqual(updated.passwordHash, previousHash)
    assert.equal(await bcrypt.compare('replacement-password-123', updated.passwordHash), true)

    const oldSession = await request('/api/admin/overview', { token: session.token })
    assert.equal(oldSession.status, 401)
    const newSession = await login(account.email, 'replacement-password-123', { admin: true })
    assert.equal(newSession.user.role, 'admin')

    const regular = await createAccount()
    await assert.rejects(
      resetAdminPassword(regular.email, 'another-password-123'),
      /must match an existing administrator/,
    )
  })
}
