"use client";

import "./services-section.css";

interface Service {
  id: string;
  title: string;
  description: string;
}

interface ServicesSectionProps {
  title?: string;
  services: Service[];
}

export default function ServicesSection({
  title = "Custom services",
  services,
}: ServicesSectionProps) {
  return (
    <section className="services-section">
      <div className="services-container">
        <h2 className="services-title">{title}</h2>
        <div className="services-grid">
          {services.map((service) => (
            <div key={service.id} className="service-item">
              <h3 className="service-title">{service.title}</h3>
              <p className="service-description">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

