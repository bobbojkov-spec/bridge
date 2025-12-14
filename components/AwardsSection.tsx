"use client";

import "./awards-section.css";

interface Award {
  id: string;
  title: string;
  image?: string;
}

interface AwardsSectionProps {
  title?: string;
  awards: Award[];
}

export default function AwardsSection({
  title = "Awards",
  awards,
}: AwardsSectionProps) {
  return (
    <section className="awards-section">
      <div className="awards-container">
        <h2 className="awards-title">{title}</h2>
        <div className="awards-grid">
          {awards.map((award) => (
            <div key={award.id} className="award-item">
              {award.image ? (
                <img
                  src={award.image}
                  alt={award.title}
                  className="award-image"
                />
              ) : (
                <div className="award-placeholder">
                  <span className="award-text">{award.title}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

