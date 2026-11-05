import React from 'react';
import { Users } from 'lucide-react';

export default function CollaboratorList({ collaborators = [], currentUser }) {
  const count = collaborators.length;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
      <div className="collaborator-stack" title={`Active collaborators: ${collaborators.map((c) => c.userName).join(', ')}`}>
        {collaborators.slice(0, 5).map((user) => {
          const isMe = currentUser && currentUser.userId === user.userId;
          const initial = (user.userName || 'U').charAt(0).toUpperCase();

          return (
            <div
              key={user.socketId || user.userId}
              className="collab-avatar"
              style={{ backgroundColor: user.color || '#4f46e5' }}
              title={`${user.userName}${isMe ? ' (You)' : ''}`}
            >
              {initial}
            </div>
          );
        })}

        {count > 5 && (
          <div
            className="collab-avatar"
            style={{ backgroundColor: '#64748b' }}
            title={`${count - 5} more collaborators`}
          >
            +{count - 5}
          </div>
        )}
      </div>

      <div className="badge badge-indigo" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
        <Users size={12} />
        <span>{count} {count === 1 ? 'user' : 'users'}</span>
      </div>
    </div>
  );
}
