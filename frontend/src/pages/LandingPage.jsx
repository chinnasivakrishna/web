import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  CheckCircle,
  BookOpen,
  Users,
  Award,
  Briefcase,
  Layers,
  HelpCircle,
  Mail,
  Phone,
  MessageSquare,
  ChevronDown,
  Star,
  Zap,
} from 'lucide-react';
import CourseCard from '../components/CourseCard';
import { courseService } from '../services/courseService';
import { CourseSkeleton } from '../components/Skeletons';

const LandingPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    const fetchPopularCourses = async () => {
      try {
        const data = await courseService.getCourses({ status: 'published' });
        if (data.success) {
          setCourses(data.courses.slice(0, 3));
        }
      } catch (error) {
        console.log('Using fallback demo courses for landing page');
        // Fallback demo courses if backend server is starting
        setCourses([
          {
            _id: '1',
            title: 'Full-Stack MERN Development Masterclass',
            slug: 'full-stack-mern-development-masterclass',
            description: 'Master React 19, Node.js, Express, MongoDB, and Tailwind CSS by building industry-grade web applications.',
            thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=80',
            duration: '12 Weeks',
            category: 'Full Stack Development',
            level: 'Intermediate',
            price: 14999,
            discountPrice: 9999,
            skills: ['React.js', 'Node.js', 'MongoDB', 'Express', 'Tailwind CSS'],
          },
          {
            _id: '2',
            title: 'Python Data Science & Machine Learning Bootcamp',
            slug: 'python-data-science-and-machine-learning-bootcamp',
            description: 'Comprehensive data analysis, visualization, and predictive modeling using Python, Pandas, NumPy, and TensorFlow.',
            thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
            duration: '10 Weeks',
            category: 'Data Science',
            level: 'Beginner',
            price: 12999,
            discountPrice: 8499,
            skills: ['Python', 'Pandas', 'NumPy', 'Scikit-Learn', 'AI'],
          },
          {
            _id: '3',
            title: 'DevOps & AWS Cloud Infrastructure Specialization',
            slug: 'devops-and-aws-cloud-infrastructure-specialization',
            description: 'Learn Docker, Kubernetes, CI/CD pipelines, Terraform, and AWS Cloud Architecture to deploy scalable enterprise web apps.',
            thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
            duration: '8 Weeks',
            category: 'Cloud & DevOps',
            level: 'Advanced',
            price: 16999,
            discountPrice: 11999,
            skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD'],
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularCourses();
  }, []);

  const whyChooseUs = [
    {
      icon: BookOpen,
      title: 'Industry-Aligned Curriculum',
      description: 'Courses crafted with top tech leaders to cover modern tools, frameworks, and coding standards demanded by global companies.',
    },
    {
      icon: Users,
      title: 'Senior Industry Mentors',
      description: 'Direct mentorship from experienced Principal Architects and Software Engineers working in leading IT organizations.',
    },
    {
      icon: Briefcase,
      title: 'Hands-on Internships',
      description: 'Work on live commercial client projects during training to build a strong portfolio and earn verified experience certificates.',
    },
    {
      icon: Award,
      title: '100% Career Support',
      description: 'Dedicated placement assistance, mock technical interviews, resume optimization, and referral networks for top roles.',
    },
  ];

  const learningSteps = [
    {
      step: '01',
      title: 'Register & Admin Approval',
      description: 'Create your student account. Our admin team verifies credentials to ensure a high-quality cohort.',
    },
    {
      step: '02',
      title: 'Enroll in Domain Course',
      description: 'Choose your desired specialization in MERN Stack, Data Science, or Cloud DevOps.',
    },
    {
      step: '03',
      title: 'Live Mentorship & Code Labs',
      description: 'Attend interactive live sessions, complete code challenges, and build real-world microservices.',
    },
    {
      step: '04',
      title: 'Internship & Certification',
      description: 'Graduate with verified course credentials and guaranteed internship opportunities to launch your career.',
    },
  ];

  const studentBenefits = [
    '24/7 Dedicated Doubt Clarification Forum',
    'Real-world Capstone Project Deployments',
    'AI-driven Resume Building & Review',
    '1-on-1 Mock Interview Sessions',
    'Lifetime Access to Recorded Lectures',
    'Industry-Recognized Verification Badge',
  ];

  const testimonials = [
    {
      name: 'Sai Varun Teja',
      role: 'Full Stack Developer at Infosys',
      comment: 'StuVaradhi transformed my coding foundation! The MERN stack mentorship gave me real confidence, and the admin-curated cohort made learning so collaborative.',
      image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
      rating: 5,
    },
    {
      name: 'Ananya Reddy',
      role: 'Associate Software Engineer at Wipro',
      comment: 'The student approval system ensures that every batch has dedicated learners. Working on live internship projects was the highlight of my learning journey.',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
      rating: 5,
    },
    {
      name: 'Karthik Rao',
      role: 'DevOps Engineer at Tech Mahindra',
      comment: 'Bridging Students to Success is not just a tagline—it is reality! The mentors guided me step-by-step from Docker basics to AWS cloud deployment.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      rating: 5,
    },
  ];

  const faqs = [
    {
      q: 'How does the student approval process work?',
      a: 'After registering on StuVaradhi, your account status is set to Pending. Our admin team reviews your registration to prevent spam. Once approved, you receive an automated confirmation email and can log in immediately.',
    },
    {
      q: 'Are the training programs beginner-friendly?',
      a: 'Yes! We offer foundational modules for beginners as well as advanced masterclasses for intermediate developers. Each course clearly specifies prerequisites.',
    },
    {
      q: 'Will I receive an official certificate upon completion?',
      a: 'Absolutely! Every student who completes the course assignments and capstone project earns a verified StuVaradhi Certificate of Completion with a unique verification code.',
    },
    {
      q: 'Does StuVaradhi provide internship opportunities?',
      a: 'Yes, eligible students who maintain good performance are offered hands-on internship opportunities on active projects built within our platform tech ecosystem.',
    },
  ];

  return (
    <div className="space-y-24 pb-20 overflow-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 lg:pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="gradient-glow top-10 left-10 w-96 h-96 bg-brand-500/20" />
        <div className="gradient-glow bottom-10 right-10 w-96 h-96 bg-cyan-500/20" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border border-brand-500/30 text-xs font-bold text-brand-600 dark:text-brand-400"
            >
              <Sparkles className="w-4 h-4 text-brand-500 animate-spin" />
              <span>BRIDGING STUDENTS TO SUCCESS</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight"
            >
              Empower Your Tech Career with <span className="gradient-text">StuVaradhi</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl"
            >
              Transform your coding ambitions into high-paying tech roles. Join industry-aligned masterclasses in MERN Full-Stack, Data Science, and Cloud DevOps with real-world internship projects.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2"
            >
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 shadow-glow transition-all hover:scale-105"
              >
                Start Learning Now
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/courses"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-bold text-slate-800 dark:text-slate-200 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all"
              >
                Explore Courses
              </Link>
            </motion.div>

            {/* Quick Metrics */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="pt-8 border-t border-slate-200/80 dark:border-slate-800/80 grid grid-cols-2 gap-4"
            >
              <div>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">200+</p>
                <p className="text-xs text-slate-500 font-medium">Approved Students</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-emerald-500">4.9★</p>
                <p className="text-xs text-slate-500 font-medium">Student Rating</p>
              </div>
            </motion.div>
          </div>

          {/* Hero Visual Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 relative"
          >
            <div className="glass-panel p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl relative z-10 space-y-6">
              <div className="relative rounded-2xl overflow-hidden shadow-md">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80"
                  alt="StuVaradhi Training Platform"
                  className="w-full h-64 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
                  <div className="text-white">
                    <p className="text-xs font-semibold text-brand-400">Featured Cohort</p>
                    <p className="text-base font-bold">MERN Full-Stack Internship Batch 2026</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500" /> Live Interactive Mentorship
                  </span>
                  <span className="text-emerald-500">Enrolling Now</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-brand-500 to-emerald-500 h-full w-[85%]" />
                </div>
              </div>

              <div className="bg-brand-50/80 dark:bg-brand-950/40 p-4 rounded-2xl border border-brand-200/60 dark:border-brand-900/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Admin Approval Required</p>
                    <p className="text-[11px] text-slate-500">Quality Assured Student Batches</p>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-brand-600 dark:text-brand-400">Verified</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. ABOUT STUVARADHI */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card p-8 sm:p-12 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                About StuVaradhi
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                Where Ambition Meets Industry Standards
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Founded with a mission to bridge the gap between academic education and modern software engineering demands, <strong>StuVaradhi</strong> ("Bridging Students to Success") provides structured training, hand-on lab environments, and direct mentorship.
              </p>
              <div className="grid grid-cols-1 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white">100+</h4>
                  <p className="text-xs text-slate-500">Hands-on Code Projects</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <img
                src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80"
                alt="StuVaradhi Mentors"
                className="w-full h-80 object-cover rounded-2xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. WHY CHOOSE US */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Why Choose Us
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
            Built for Serious Career Builders
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Unlike generic platforms, StuVaradhi combines rigorous admin approval with high-impact live training.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {whyChooseUs.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                whileHover={{ y: -6 }}
                className="glass-card p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{item.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 4. POPULAR COURSES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Top Programs
            </span>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">
              Explore Popular Masterclasses
            </h2>
          </div>
          <Link
            to="/courses"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
          >
            View All Courses
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CourseSkeleton />
            <CourseSkeleton />
            <CourseSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard key={course._id || course.slug} course={course} />
            ))}
          </div>
        )}
      </section>

      {/* 5. LEARNING PROCESS */}
      <section className="bg-slate-900 text-white py-16 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
              Structured Roadmap
            </span>
            <h2 className="text-3xl font-black">Our 4-Step Learning Process</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {learningSteps.map((step, idx) => (
              <div
                key={idx}
                className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700 relative space-y-3"
              >
                <span className="text-4xl font-black text-brand-500/40">{step.step}</span>
                <h3 className="text-base font-bold text-white">{step.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. STUDENT BENEFITS & INTERNSHIP FEATURES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Student Perks
            </span>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">
              Comprehensive Benefits & Real-World Internships
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              We go beyond video tutorials. StuVaradhi students receive complete end-to-end support to convert learning into high-growth career opportunities.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {studentBenefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="glass-card p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Guaranteed Internship Pathway</h3>
                  <p className="text-xs text-slate-500">Commercial projects & performance evaluations</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Eligible students gain access to internal StuVaradhi software development tasks, working alongside tech leads to ship production features.
              </p>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                <span>Verified Internship Certificate Included</span>
                <Award className="w-5 h-5 text-amber-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Student Reviews
          </span>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white">Success Stories</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div key={idx} className="glass-card p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 italic">"{t.comment}"</p>
              <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <img src={t.image} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{t.name}</h4>
                  <p className="text-[11px] text-slate-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. FAQ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Questions?
          </span>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800"
            >
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full px-6 py-4 text-left flex items-center justify-between text-sm font-bold text-slate-900 dark:text-white"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    activeFaq === idx ? 'rotate-180 text-brand-500' : ''
                  }`}
                />
              </button>
              {activeFaq === idx && (
                <div className="px-6 pb-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 9. CONTACT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-slate-200/80 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Get in Touch
            </span>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">Have Questions? Reach Out to Us</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Our career advisors are available to guide you regarding registration, approval status, or course selection.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Mail className="w-4 h-4 text-brand-500" />
                <span>support@stuvaradhi.in</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Phone className="w-4 h-4 text-brand-500" />
                <span>+91 9381000032</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Send Us a Direct Message</h3>
            <form onSubmit={(e) => { e.preventDefault(); alert('Message sent successfully!'); }} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Your Full Name"
                  required
                  className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-brand-500"
                />
                <input
                  type="email"
                  placeholder="Your Email Address"
                  required
                  className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-brand-500"
                />
              </div>
              <textarea
                placeholder="How can we help you?"
                rows={4}
                required
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-brand-500"
              />
              <button
                type="submit"
                className="w-full py-3 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 transition-colors shadow-sm"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
