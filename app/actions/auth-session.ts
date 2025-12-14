'use server'

import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'firebase_uid';

export async function setSession(uid: string) {
  cookies().set(SESSION_COOKIE_NAME, uid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  });
}

export async function getSessionUid(): Promise<string | undefined> {
  const cookieStore = cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}

export async function clearSession() {
  cookies().delete(SESSION_COOKIE_NAME);
}
