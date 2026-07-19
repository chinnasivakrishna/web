import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, BookOpen, Award, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const CourseCard = ({ course }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between group hover:border-brand-500/50"
    >
      <div>
        <div className="relative overflow-hidden h-48">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full">
            {course.category}
          </div>
          <div className="absolute top-3 right-3 bg-brand-600/90 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            {course.level}
          </div>
        </div>

        <div className="p-5 space-y-3">
          <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-brand-500" />
              {course.duration}
            </span>
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-emerald-500" />
              Certificate
            </span>
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            {course.title}
          </h3>

          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
            {course.description}
          </p>

          {course.skills && course.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {course.skills.slice(0, 3).map((skill, idx) => (
                <span
                  key={idx}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                >
                  {skill}
                </span>
              ))}
              {course.skills.length > 3 && (
                <span className="text-[11px] font-medium px-1.5 py-0.5 text-slate-400">
                  +{course.skills.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-5 pt-0 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 mt-4">
        <div>
          <span className="text-xs text-slate-400 line-through mr-2">
            ₹{course.price?.toLocaleString()}
          </span>
          <span className="text-lg font-extrabold text-brand-600 dark:text-brand-400">
            ₹{course.discountPrice?.toLocaleString()}
          </span>
        </div>

        <Link
          to={`/course/${course.slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 px-4 py-2 rounded-xl transition-all shadow-sm group-hover:shadow-glow"
        >
          View Details
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </motion.div>
  );
};

export default CourseCard;
