// Shared by the scripts that run on the owner's machine (seed, tests).
// They use the service key, which bypasses the access rules, so this
// file must never be imported by browser code in src/.

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import Papa from 'papaparse'

// Reads a required setting from .env.local (loaded by the npm script).
export function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    console.error(`Missing ${name}. Set it in .env.local (see .env.example).`)
    process.exit(1)
  }
  return value
}

const options = { auth: { persistSession: false, autoRefreshToken: false } }

// Full access. For setup scripts only.
export function adminClient() {
  return createClient(
    requireEnv('VITE_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    options,
  )
}

// What a browser gets: subject to the access rules.
export function browserLikeClient() {
  return createClient(
    requireEnv('VITE_SUPABASE_URL'),
    requireEnv('VITE_SUPABASE_ANON_KEY'),
    options,
  )
}

// Reads a file of data/ as text.
export function readData(name) {
  return readFileSync(new URL(`../../data/${name}`, import.meta.url), 'utf8')
}

// Reads a CSV of data/ as a list of objects keyed by column name.
export function readDataCsv(name) {
  const parsed = Papa.parse(readData(name), {
    header: true,
    skipEmptyLines: true,
  })
  if (parsed.errors.length > 0) {
    throw new Error(`${name}: ${parsed.errors[0].message}`)
  }
  return parsed.data
}

// Stops the script with the database's message when a call failed.
// supabase-js returns errors instead of throwing, so each call is wrapped.
export function must({ data, error }, what) {
  if (error) {
    console.error(`${what} failed: ${error.message}`)
    process.exit(1)
  }
  return data
}

// Returns the user with this email, creating it when missing.
export async function ensureUser(admin, email, password) {
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // no confirmation email for a demo account
  })
  if (!created.error) return created.data.user

  // Most likely the user exists already: find it and reset the password.
  const list = must(
    await admin.auth.admin.listUsers({ perPage: 1000 }),
    'List users',
  )
  const existing = list.users.find((user) => user.email === email)
  if (!existing) {
    console.error(`Create user ${email} failed: ${created.error.message}`)
    process.exit(1)
  }
  must(
    await admin.auth.admin.updateUserById(existing.id, { password }),
    'Update user',
  )
  return existing
}
