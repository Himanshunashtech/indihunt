export default function Loading() {
  // No spinner — product page renders instantly from SSR initialProduct data.
  // This prevents any flash of a loading screen during navigation.
  return <div className="min-h-screen bg-background" />;
}