const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Course = require('../models/Course');

dotenv.config();

const seedData = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('[Seed] Database not connected. Skipping seed execution.');
      return;
    }

    console.log('[Seed] Checking for existing Super Admin...');

    // 1. Seed Admin User
    let admin = await User.findOne({ email: 'admin@stuvaradhi.com' });
    if (!admin) {
      admin = await User.create({
        name: 'StuVaradhi Super Admin',
        email: 'admin@stuvaradhi.com',
        phone: '+91 9876543210',
        password: 'Admin@123456',
        role: 'admin',
        status: 'Approved',
        profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      });
      console.log('✅ Created Default Admin Account: admin@stuvaradhi.com / Admin@123456');
    } else {
      console.log('ℹ️ Admin Account already exists: admin@stuvaradhi.com');
    }

    // 1b. Seed Default Faculty Account
    let faculty = await User.findOne({ email: 'faculty@stuvaradhi.com' });
    if (!faculty) {
      faculty = await User.create({
        name: 'Dr. Rajesh Khanna',
        email: 'faculty@stuvaradhi.com',
        phone: '+91 9876599999',
        password: 'Faculty@123456',
        role: 'faculty',
        status: 'Approved',
        department: 'Computer Science & Engineering',
        designation: 'Senior Lead Mentor & Professor',
        specialization: 'Full-Stack Web Architectures',
        profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
      });
      console.log('✅ Created Default Faculty Account: faculty@stuvaradhi.com / Faculty@123456');
    }

    // 2. Seed Demo Students
    const studentCount = await User.countDocuments({ role: 'student' });
    if (studentCount === 0) {
      await User.create([
        {
          name: 'Rahul Sharma',
          email: 'rahul.s@example.com',
          phone: '+91 9876500001',
          password: 'Password@123',
          role: 'student',
          status: 'Pending',
          profileImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
        },
        {
          name: 'Priya Verma',
          email: 'priya.v@example.com',
          phone: '+91 9876500002',
          password: 'Password@123',
          role: 'student',
          status: 'Approved',
          profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
        },
        {
          name: 'Anish Kumar',
          email: 'anish.k@example.com',
          phone: '+91 9876500003',
          password: 'Password@123',
          role: 'student',
          status: 'Pending',
          profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
        },
        {
          name: 'Sneha Patel',
          email: 'sneha.p@example.com',
          phone: '+91 9876500004',
          password: 'Password@123',
          role: 'student',
          status: 'Rejected',
          profileImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
        },
      ]);
      console.log('✅ Created Demo Students (Pending, Approved, Rejected)');
    }

    // 3. Seed Demo Courses
    const courseCount = await Course.countDocuments();
    if (courseCount === 0) {
      await Course.create([
        {
          title: 'Full-Stack MERN Development Masterclass',
          slug: 'full-stack-mern-development-masterclass',
          description: 'Master React 19, Node.js, Express, MongoDB, and Tailwind CSS by building industry-grade web applications. Learn state management, authentication, REST API design, and cloud deployment.',
          thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=80',
          duration: '12 Weeks',
          category: 'Full Stack Development',
          level: 'Intermediate',
          price: 14999,
          discountPrice: 9999,
          learningOutcomes: [
            'Build full-stack web applications using MERN stack',
            'Implement JWT Auth, Role-Based Access, and Security headers',
            'Master State Management with React Context and Hooks',
            'Deploy production apps to Vercel and AWS',
          ],
          skills: ['React.js', 'Node.js', 'Express', 'MongoDB', 'Tailwind CSS', 'REST API'],
          curriculum: [
            {
              sectionTitle: 'Module 1: HTML5, CSS3 & Modern JavaScript (ES6+)',
              lessons: [
                { title: 'Semantic HTML & Flexbox Layouts', duration: '45 mins', isFreePreview: true },
                { title: 'Async JS, Promises & Fetch API', duration: '60 mins', isFreePreview: true },
              ],
            },
            {
              sectionTitle: 'Module 2: React 19 Core & Hooks',
              lessons: [
                { title: 'Components, Props & State', duration: '50 mins', isFreePreview: false },
                { title: 'Custom Hooks & Context API', duration: '75 mins', isFreePreview: false },
              ],
            },
            {
              sectionTitle: 'Module 3: Backend API Development with Express',
              lessons: [
                { title: 'Express Routing & Middleware', duration: '60 mins', isFreePreview: false },
                { title: 'Mongoose Schemas & Controllers', duration: '90 mins', isFreePreview: false },
              ],
            },
          ],
          certificateIncluded: true,
          instructorName: 'Siva Krishna Thota',
          instructorRole: 'Principal Full Stack Architect',
          status: 'published',
          createdBy: admin._id,
        },
        {
          title: 'Python Data Science & Machine Learning Bootcamp',
          slug: 'python-data-science-and-machine-learning-bootcamp',
          description: 'Comprehensive data analysis, visualization, and predictive modeling using Python, Pandas, NumPy, Scikit-Learn, and TensorFlow.',
          thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
          duration: '10 Weeks',
          category: 'Data Science',
          level: 'Beginner',
          price: 12999,
          discountPrice: 8499,
          learningOutcomes: [
            'Clean and transform complex datasets using Pandas',
            'Build predictive models using Scikit-Learn',
            'Create insightful data visualizations with Matplotlib & Seaborn',
          ],
          skills: ['Python', 'Pandas', 'NumPy', 'Scikit-Learn', 'Machine Learning'],
          curriculum: [
            {
              sectionTitle: 'Module 1: Python Fundamentals for Data Science',
              lessons: [
                { title: 'Data Structures & Control Flow', duration: '40 mins', isFreePreview: true },
              ],
            },
          ],
          certificateIncluded: true,
          instructorName: 'Dr. Ramesh Chandra',
          instructorRole: 'Chief Data Scientist',
          status: 'published',
          createdBy: admin._id,
        },
        {
          title: 'DevOps & AWS Cloud Infrastructure Specialization',
          slug: 'devops-and-aws-cloud-infrastructure-specialization',
          description: 'Learn Docker, Kubernetes, CI/CD pipelines, Terraform, and AWS Cloud Architecture to deploy scalable enterprise web apps.',
          thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
          duration: '8 Weeks',
          category: 'Cloud & DevOps',
          level: 'Advanced',
          price: 16999,
          discountPrice: 11999,
          learningOutcomes: [
            'Containerize applications using Docker',
            'Orchestrate microservices with Kubernetes',
            'Build automated CI/CD pipelines with GitHub Actions',
          ],
          skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform'],
          curriculum: [
            {
              sectionTitle: 'Module 1: Containerization with Docker',
              lessons: [
                { title: 'Docker Containers & Multi-stage Builds', duration: '55 mins', isFreePreview: true },
              ],
            },
          ],
          certificateIncluded: true,
          instructorName: 'Anil Kumar',
          instructorRole: 'AWS Certified Cloud Solutions Architect',
          status: 'published',
          createdBy: admin._id,
        },
      ]);
      console.log('✅ Created Demo Courses');
    }
  } catch (error) {
    console.error('❌ Error Seeding Data:', error.message);
  }
};

module.exports = seedData;

if (require.main === module) {
  seedData().then(() => {
    console.log('Seeding complete!');
    process.exit(0);
  });
}
