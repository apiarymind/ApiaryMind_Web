import { getCurrentUserProfile } from '@/app/actions/get-user';

export default async function DebugPage() {
  const HARDCODED_UID = 'wf5W...'; // This will fail if not replaced with a valid ID, but since I don't have one, I'll use a placeholder or try to find one.
  // The instructions said "e.g., starting with wf5W...". I should probably try to find one if I can, or just implement the page and let the user test it.
  // But wait, the user said "create a simple test page ... to verify the normalizer works".
  
  // I will use a mock call if the real one fails or returns null, just to verify the normalizer part if I can't access DB.
  // But strictly I should call `getCurrentUserProfile`.

  const profile = await getCurrentUserProfile(HARDCODED_UID);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Debug Profile</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(profile, null, 2)}
      </pre>
      {!profile && <p className="text-red-500">Profile not found or error occurred.</p>}
    </div>
  );
}
