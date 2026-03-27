// Production Google OAuth helper
// This function initiates the OAuth flow by redirecting the browser to the serverless start endpoint.
export const handleGoogleSignIn = () => {
  // Redirect to the Vercel serverless function that starts the Google OAuth process.
  // The function will handle state, redirect to Google, and eventually set a session cookie.
  window.location.href = '/api/auth/google';
};
