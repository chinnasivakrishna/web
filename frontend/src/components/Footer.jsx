import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Mail, Phone, MapPin, ShieldCheck, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 border-t border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-600 flex items-center justify-center text-white">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="text-2xl font-black text-white">
                Stu<span className="gradient-text">Varadhi</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Bridging Students to Success with industry-focused training, real-world project experience, and career mentorship.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-brand-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Certified Training & Internship Partner</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="hover:text-brand-400 transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-brand-400 transition-colors">About StuVaradhi</Link>
              </li>
              <li>
                <Link to="/courses" className="hover:text-brand-400 transition-colors">Training Programs</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-brand-400 transition-colors">Contact Support</Link>
              </li>
              <li>
                <Link to="/admin/login" className="hover:text-brand-400 text-slate-400 transition-colors flex items-center gap-1">
                  <span>Admin Access</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Specializations */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Specializations</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>Full Stack MERN Web Development</li>
              <li>Python Data Science & AI</li>
              <li>Cloud Computing & AWS DevOps</li>
              <li>UI/UX Design & Frontend Systems</li>
              <li>Student Internship Pathways</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3 text-slate-400">
                <Mail className="w-5 h-5 text-brand-500 shrink-0" />
                <span>support@stuvaradhi.in</span>
              </li>
              <li className="flex items-center gap-3 text-slate-400">
                <Phone className="w-5 h-5 text-brand-500 shrink-0" />
                <span>+91 9381000032</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} StuVaradhi. All rights reserved. "Bridging Students to Success".</p>
          <div className="flex items-center gap-1">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>for future tech leaders.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
