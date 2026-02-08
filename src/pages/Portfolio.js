import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Portfolio.css';
import NavBar from '../components/common/NavBar';

function Portfolio() {
  const getCompanyInitials = (company = "") => company
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  const projects = [
    {
      id: 1,
      title: "Industrial Temperature Monitoring",
      description: "Real-time temperature and humidity monitoring system for manufacturing facilities with predictive alerts.",
      category: "Manufacturing",
      image: "https://via.placeholder.com/600x400?text=Temperature+Monitoring"
    },
    {
      id: 2,
      title: "Smart Agriculture IoT Platform",
      description: "Comprehensive IoT solution for automated irrigation, soil moisture tracking, and crop health monitoring.",
      category: "Agriculture",
      image: "https://via.placeholder.com/600x400?text=Smart+Agriculture"
    },
    {
      id: 3,
      title: "Building Automation System",
      description: "Centralized control system for HVAC, lighting, and security across multiple floors with energy optimization.",
      category: "Smart Buildings",
      image: "https://via.placeholder.com/600x400?text=Building+Automation"
    },
    {
      id: 4,
      title: "Fleet Vehicle Tracking",
      description: "GPS-enabled vehicle tracking, maintenance monitoring, and fuel consumption analytics for logistics companies.",
      category: "Logistics",
      image: "https://via.placeholder.com/600x400?text=Fleet+Tracking"
    },
    {
      id: 5,
      title: "Water Quality Monitoring",
      description: "Distributed sensor network for real-time water quality analysis with automated contamination detection.",
      category: "Environmental",
      image: "https://via.placeholder.com/600x400?text=Water+Quality"
    },
    {
      id: 6,
      title: "Predictive Maintenance Dashboard",
      description: "Machine learning-powered predictive maintenance system that reduces downtime and increases equipment lifespan.",
      category: "Maintenance",
      image: "https://via.placeholder.com/600x400?text=Predictive+Maintenance"
    }
  ];

  const testimonials = [
    {
      name: "John Smith",
      role: "Operations Manager",
      company: "TechFactory Inc.",
      feedback: "EdgeSync reduced our IoT deployment time by 60%. The platform is intuitive and the support team is excellent.",
      rating: 5
    },
    {
      name: "Sarah Chen",
      role: "CTO",
      company: "GreenTech Solutions",
      feedback: "Finally, an IoT platform that doesn't require our engineers to become cloud architects. Highly recommended.",
      rating: 5
    },
    {
      name: "Mike Johnson",
      role: "Project Lead",
      company: "LogisticsPro",
      feedback: "The real-time analytics and dashboards have transformed how we monitor our fleet. ROI in 3 months.",
      rating: 5
    }
  ];

  return (
    <div className="portfolio-page">
      <NavBar />

      {/* Hero Section */}
      <section className="portfolio-hero">
        <div className="portfolio-container">
          <div className="portfolio-hero-content">
            <h1 className="portfolio-hero-title">Featured Projects & Case Studies</h1>
            <p className="portfolio-hero-subtitle">
              Discover how organizations worldwide are leveraging EdgeSync to build transformative IoT solutions
            </p>
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section className="featured-projects">
        <div className="portfolio-container">
          <div className="section-header">
            <h2>Success Stories</h2>
            <p>Explore real-world implementations across industries</p>
          </div>
          <div className="projects-grid">
            {projects.map((project) => (
              <div key={project.id} className="project-card">
                <div className="project-image">
                  <img src={project.image} alt={project.title} />
                  <div className="project-overlay">
                    <span className="project-category">{project.category}</span>
                  </div>
                </div>
                <div className="project-content">
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                  <button type="button" className="learn-more">
                    Read Case Study →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="portfolio-stats">
        <div className="portfolio-container">
          <div className="stats-showcase">
            <div className="stat-item">
              <div className="stat-value">500+</div>
              <div className="stat-title">Active Projects</div>
              <div className="stat-description">Deployed across 45+ countries</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">10M+</div>
              <div className="stat-title">Data Points/Day</div>
              <div className="stat-description">Processed with 99.9% reliability</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">2.5B+</div>
              <div className="stat-title">IoT Messages</div>
              <div className="stat-description">Successfully handled monthly</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">98%</div>
              <div className="stat-title">Customer Satisfaction</div>
              <div className="stat-description">Based on latest survey</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="portfolio-testimonials">
        <div className="portfolio-container">
          <div className="section-header">
            <h2>What Our Clients Say</h2>
            <p>Trusted by leading organizations worldwide</p>
          </div>
          <div className="testimonials-scroll" aria-label="Client testimonials">
            <div className="testimonials-track">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="testimonial-card">
                  <div className="testimonial-header">
                    <div className="company-logo" aria-hidden="true">
                      {getCompanyInitials(testimonial.company)}
                    </div>
                    <div className="testimonial-rating">
                      {'⭐'.repeat(testimonial.rating)}
                    </div>
                  </div>
                  <p className="testimonial-text">"{testimonial.feedback}"</p>
                  <div className="testimonial-author">
                    <div className="author-avatar">{testimonial.name.charAt(0)}</div>
                    <div className="author-info">
                      <div className="author-name">{testimonial.name}</div>
                      <div className="author-role">{testimonial.role} at {testimonial.company}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="tech-stack">
        <div className="portfolio-container">
          <div className="section-header">
            <h2>Supported Platforms & Technologies</h2>
            <p>Works seamlessly with your existing infrastructure</p>
          </div>
          <div className="tech-grid">
            <div className="tech-card">
              <div className="tech-icon">🔌</div>
              <h3>Hardware</h3>
              <p>ESP32, Arduino, Raspberry Pi, and more</p>
            </div>
            <div className="tech-card">
              <div className="tech-icon">🌐</div>
              <h3>Connectivity</h3>
              <p>WiFi, LoRaWAN, NB-IoT, 4G/5G</p>
            </div>
            <div className="tech-card">
              <div className="tech-icon">📡</div>
              <h3>Protocols</h3>
              <p>MQTT, HTTP, CoAP, WebSocket</p>
            </div>
            <div className="tech-card">
              <div className="tech-icon">☁️</div>
              <h3>Cloud</h3>
              <p>AWS, Azure, Google Cloud compatible</p>
            </div>
            <div className="tech-card">
              <div className="tech-icon">🗄️</div>
              <h3>Databases</h3>
              <p>InfluxDB, PostgreSQL, MongoDB</p>
            </div>
            <div className="tech-card">
              <div className="tech-icon">📊</div>
              <h3>Analytics</h3>
              <p>Real-time dashboards and SQL queries</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="portfolio-cta">
        <div className="portfolio-container">
          <div className="cta-box">
            <h2>Ready to Build Your Success Story?</h2>
            <p>Join hundreds of organizations transforming their operations with EdgeSync</p>
            <div className="cta-buttons">
              <Link to="/signup" className="btn btn-primary btn-large">
                Start Your Project
              </Link>
              <a href="/#features" className="btn btn-outline btn-large">
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="portfolio-footer">
        <div className="portfolio-container">
          <div className="footer-content">
            <div className="footer-brand">
              <h3>EdgeSync</h3>
              <p>Multi-Tenant IoT Platform by Roboworks Automation</p>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#portfolio">Portfolio</a>
                <a href="#docs">Documentation</a>
              </div>
              <div className="footer-column">
                <h4>Company</h4>
                <a href="#about">About</a>
                <a href="#contact">Contact</a>
                <a href="#support">Support</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Portfolio;
