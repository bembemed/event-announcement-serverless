import { fetchAuthSession } from '@aws-amplify/auth';

export async function getAuthToken() {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString();
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}
