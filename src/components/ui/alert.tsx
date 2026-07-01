export function AlertBanner({ error, success }: { error?: string; success?: string }) {
  if (!error && !success) return null;
  if (error) {
    return (
      <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
    );
  }
  return (
    <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
      {success}
    </div>
  );
}
