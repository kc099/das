import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Homepage.css';
import NavBar from '../components/common/NavBar';

function Homepage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuthStatus = () => {
      const accessToken = localStorage.getItem('access_token');
      const user = localStorage.getItem('user');
      
      if (accessToken && user) {
        // User is logged in, redirect to dashboard
        navigate('/home');
      }
    };

    checkAuthStatus();
  }, [navigate]);

  const features = [
    {
      title: "Edge Device Management",
      description: "Register, monitor, and control your IoT devices with enterprise-grade security and scalability.",
      icon: "🔧"
    },
    {
      title: "Real-time Analytics",
      description: "Visualize device data with comprehensive dashboards and advanced SQL analytics capabilities.",
      icon: "📊"
    },
    {
      title: "Low-Code Designer",
      description: "Create stunning IoT dashboards without coding using our visual EdgeBoard designer.",
      icon: "🎨"
    },
    {
      title: "MQTT Broker",
      description: "Secure, scalable MQTT v3.1-v5.0 broker with TLS/SSL encryption and ACL management.",
      icon: "🔒"
    },
    {
      title: "OTA Updates",
      description: "Keep your device fleet current with over-the-air updates and selective deployment.",
      icon: "📲"
    },
    {
      title: "Multi-Tenant Platform",
      description: "Isolated, secure environments for multiple projects with dedicated AWS databases.",
      icon: "🏢"
    }
  ];

  const howToSteps = [
    {
      step: "1",
      title: "Define Your Devices",
      description: "Register your IoT products and devices on our platform with just a few clicks."
    },
    {
      step: "2", 
      title: "Create Projects",
      description: "Organize devices into projects and assign them to team members with proper access controls."
    },
    {
      step: "3",
      title: "Design Dashboards",
      description: "Use Flow Designer to create custom workflows on your devices and publish multiple dashboards."
    },
    {
      step: "4",
      title: "Deploy & Monitor",
      description: "Launch your IoT solution and monitor device performance with real-time analytics."
    }
  ];

  // const pricings = [
  //   {
  //     title: "Free Tier",
  //     description: "Get started with 5 devices, 1 project, and basic features at no cost.",
  //     icon: "🔧"
  //   },
  //   {
  //     title: "Pay as You Go",
  //     description: "Visualize device data with comprehensive dashboards and advanced SQL analytics capabilities.",
  //     icon: "📊"
  //   },

  // ];

  return (
    <div className="homepage">
      {/* Navigation */}
      <NavBar />

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              The Multitenant Platform for<br />
              <span className="gradient-text">Industrial IoT</span>
            </h1>
            <p className="hero-subtitle">
{/* A unified IoT Device management platform to connect legacy hardware, <br /> build visual data flows, and deploy powerful dashboards in days, not months. */}
The edge compute platform that automation engineers <br /> an actually deploy, monitor, and maintain without becoming IT specialists.
            </p>
            <div className="hero-cta">
              <Link to="/signup" className="btn btn-primary btn-large">
                Signup Free
              </Link>
              <Link to="/login" className="btn btn-outline btn-large">
                Login 
              </Link>
            </div>
            <p className="hero-note">
              Save up to 70% of IoT design time • No credit card required
            </p>
          </div>
          
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <div className="section-header">
            <h2>Complete IoT Solution</h2>
            <p>Everything you need to build, deploy, and scale IoT applications</p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2>How EdgeSync Works</h2>
            <p>Get started in minutes, not months</p>
          </div>
          <div className="steps-container">
            {howToSteps.map((step, index) => (
              <div key={index} className="step-card">
                <div className="step-number">{step.step}</div>
                <div className="step-content">
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits">
        <div className="container">
          <div className="benefits-content">
            <div className="benefits-text">
              <h2>Why Choose EdgeSync?</h2>
              <div className="benefit-list">
                <div className="benefit-item">
                  <span className="benefit-icon">⚡</span>
                  <div>
                    <h4>5x Faster Development</h4>
                    <p>Accelerate IoT delivery with our low-code platform</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">🔐</span>
                  <div>
                    <h4>Enterprise Security</h4>
                    <p>End-to-end encryption with AWS-grade infrastructure</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">📈</span>
                  <div>
                    <h4>Unlimited Scale</h4>
                    <p>From prototype to thousands of devices seamlessly</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">📈</span>
                  <div>
                    <h4>Supported Platforms</h4>
                    <p>Arduino IDE, Esp-IDF, Python Clients</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="benefits-visual">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-number">70%</div>
                  <div className="stat-label">Time Saved</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">5x</div>
                  <div className="stat-label">Faster Deploy</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">99.9%</div>
                  <div className="stat-label">Uptime</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Pricing Section
      <section id="pricing" className="pricing">
        <div className="container">
          <div className="section-header">
            <h2>Pricing</h2>
            <p>No Credit Card Required</p>
          </div>
          <div className="features-grid">
            {pricings.map((pricing, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{pricing.icon}</div>
                <h3>{pricing.title}</h3>
                <p>{pricing.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="final-cta">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Transform Your IoT Development?</h2>
            <p>Join the community of developers building the future with EdgeSync</p>
            <div className="cta-buttons">
              <Link to="/signup" className="btn btn-primary btn-large">
                Start Free 
              </Link>
              <Link to="/login" className="btn btn-outline btn-large">
                Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <h3>EdgeSync</h3>
              <p>Multi-Tenant IoT Platform by Roboworks Automation</p>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#pricing">Pricing</a>
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

export default Homepage;