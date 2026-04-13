function fmtDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtUser(email) {
  if (!email) return null;
  // Show name part before @ for brevity
  return email.split('@')[0];
}

/**
 * Compact one-line audit stamp: "Created by alice · Updated by bob on Jan 5, 2025"
 */
export default function AuditInfo({ created_by, updated_by, updated_at, created_at }) {
  const parts = [];
  if (created_by) parts.push(`Created by ${fmtUser(created_by)}`);
  if (updated_by) {
    const when = updated_at ? ` on ${fmtDate(updated_at)}` : '';
    parts.push(`Updated by ${fmtUser(updated_by)}${when}`);
  } else if (created_at && !updated_by) {
    parts.push(fmtDate(created_at));
  }
  if (parts.length === 0) return null;
  return (
    <p className="text-xs text-gray-400 mt-1 truncate" title={parts.join(' · ')}>
      {parts.join(' · ')}
    </p>
  );
}
