import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div>
      <h1>Welcome to Kid Book Builder</h1>
      <p>The platform that helps parents and children create and publish stories together.</p>
      
      <h2 style={{ marginTop: '2rem' }}>Phase 3: Primary Feature Implementation</h2>
      <p>This phase focuses on implementing the core features of the platform:</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
        <FeatureCard 
          title="Story Templates" 
          description="Create using pre-built templates for different story types and age ranges."
          link="/templates"
        />
        <FeatureCard 
          title="Story Generator" 
          description="Get AI-powered assistance in creating and structuring stories."
          link="/generator"
        />
        <FeatureCard 
          title="Collaborative Editing" 
          description="Work together in real-time with family members."
          link="/editor"
        />
        <FeatureCard 
          title="Media Integration" 
          description="Add illustrations, audio recordings, and videos to your stories."
          link="/media"
        />
        <FeatureCard 
          title="Feedback System" 
          description="Receive age-appropriate feedback and suggestions."
          link="/feedback"
        />
      </div>
    </div>
  );
};

interface FeatureCardProps {
  title: string;
  description: string;
  link: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, link }) => {
  return (
    <div style={{ 
      backgroundColor: 'white', 
      borderRadius: '8px', 
      padding: '1.5rem', 
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
    }}>
      <h3>{title}</h3>
      <p>{description}</p>
      <Link to={link} style={{ 
        display: 'inline-block', 
        marginTop: '1rem',
        padding: '0.5rem 1rem',
        backgroundColor: '#4e54c8',
        color: 'white',
        borderRadius: '4px',
        textDecoration: 'none'
      }}>
        Try it out
      </Link>
    </div>
  );
};

export default Home; 