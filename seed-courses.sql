-- Seed sample courses for OKIKE Academy
-- Run this in your Supabase SQL Editor

-- Insert sample courses
INSERT INTO public.courses (id, title, slug, track, description, duration, image_url, instructor, lessons, position, published, created_at, updated_at)
VALUES
(
  gen_random_uuid(),
  'Full-Stack Development',
  'full-stack-development',
  'Web Development',
  'Build production-ready web applications end-to-end. Learn React, TypeScript, Node.js, Postgres, authentication, deployment, and more.',
  '12 weeks',
  null,
  'OKIKE Team',
  to_jsonb(ARRAY['Introduction to Web Development', 'HTML & CSS Basics', 'JavaScript Fundamentals', 'React Essentials', 'TypeScript Deep Dive', 'State Management', 'Node.js & Express', 'Postgres & SQL', 'Authentication & Authorization', 'Deployment & CI/CD']),
  1,
  true,
  now(),
  now()
),
(
  gen_random_uuid(),
  'Cyber Security Fundamentals',
  'cyber-security-fundamentals',
  'Security',
  'Learn offensive and defensive cybersecurity basics: networking, web exploitation, system hardening, incident response, and more.',
  '12 weeks',
  null,
  'OKIKE Team',
  to_jsonb(ARRAY['Introduction to Cybersecurity', 'Networking Essentials', 'Linux Fundamentals', 'Web Application Security', 'OWASP Top 10', 'Penetration Testing Basics', 'System Hardening', 'Incident Response', 'Security Policies', 'Ethical Hacking']),
  2,
  true,
  now(),
  now()
),
(
  gen_random_uuid(),
  'Data Analysis with Python',
  'data-analysis-with-python',
  'Data Science',
  'Turn raw data into actionable insights. Learn SQL, Python, Pandas, data visualization, statistics, and storytelling with data.',
  '12 weeks',
  null,
  'OKIKE Team',
  to_jsonb(ARRAY['Introduction to Data Analysis', 'Python Fundamentals', 'Pandas for Data Manipulation', 'SQL for Data Analysis', 'Data Cleaning', 'Exploratory Data Analysis', 'Data Visualization', 'Statistics for Data Science', 'Power BI & Tableau', 'Capstone Project']),
  3,
  true,
  now(),
  now()
),
(
  gen_random_uuid(),
  'AI & Machine Learning',
  'ai-machine-learning',
  'AI & ML',
  'Master the basics of artificial intelligence and machine learning with Python. Learn neural networks, scikit-learn, TensorFlow, and more.',
  '12 weeks',
  null,
  'OKIKE Team',
  to_jsonb(ARRAY['Introduction to AI & ML', 'Mathematics for ML', 'Python for ML', 'scikit-learn Fundamentals', 'Regression & Classification', 'Clustering & Dimensionality Reduction', 'Neural Networks Basics', 'TensorFlow & Keras', 'Deep Learning Applications', 'Capstone Project']),
  4,
  true,
  now(),
  now()
);
