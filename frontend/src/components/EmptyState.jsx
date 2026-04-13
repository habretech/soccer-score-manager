export default function EmptyState({ icon = '📋', message, action }) {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-3">{icon}</div>
      <p className="text-gray-500 text-sm mb-4">{message}</p>
      {action}
    </div>
  );
}
