// Mock Google Sign-In Utility
export const handleGoogleSignIn = async (
  onSuccess: (user: { name: string; email: string; picture?: string }) => void,
  onError: (error: string) => void
) => {
  try {
    // Return a mock user for now, since Firebase is removed.
    // In a real scenario, this would trigger an OAuth popup.
    const mockUser = {
      name: 'Google User',
      email: 'user@gmail.com',
      picture: 'https://ui-avatars.com/api/?name=Google+User&background=random',
    };

    onSuccess(mockUser);
  } catch (error: any) {
    console.error('Mock Google Sign-In Error:', error);
    onError('Failed to sign in with mock Google provider.');
  }
};
