import { testSupabase } from "./test-client";

export function hasTestCredentials(): boolean {
  return !!(process.env.TEST_USER_EMAIL && process.env.TEST_USER_PASSWORD);
}

export function skipIfNoCredentials() {
  if (!hasTestCredentials()) {
    console.warn(
      "Skipping: TEST_USER_EMAIL and TEST_USER_PASSWORD not set in .env.test"
    );
  }
  return !hasTestCredentials();
}

let signedIn = false;

export async function signInTestUser() {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.test"
    );
  }

  if (signedIn) return testSupabase;

  const { error } = await testSupabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(`Test auth failed: ${error.message}`);
  }

  signedIn = true;
  return testSupabase;
}

export async function signOutTestUser() {
  await testSupabase.auth.signOut();
  signedIn = false;
}
