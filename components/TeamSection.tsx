"use client";

import "./team-section.css";

interface TeamMember {
  id: string;
  name: string;
  role?: string;
  bio: string;
  image?: string;
}

interface TeamSectionProps {
  title?: string;
  members: TeamMember[];
}

export default function TeamSection({
  title,
  members,
}: TeamSectionProps) {
  return (
    <section className="team-section">
      <div className="team-container">
        {title && <h2 className="team-title">{title}</h2>}
        <div className="team-grid">
          {members.map((member) => (
            <div key={member.id} className="team-member">
              {member.image && (
                <div className="team-member-image-wrapper">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="team-member-image"
                  />
                </div>
              )}
              <div className="team-member-content">
                <p className="team-member-bio">{member.bio}</p>
                <p className="team-member-name">{member.name}</p>
                {member.role && (
                  <p className="team-member-role">{member.role}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

