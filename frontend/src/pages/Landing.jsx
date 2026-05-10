import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Sun, Star, Heart, BookOpen, Music, Palette, Sparkles, ArrowRight, Phone, Mail, MapPin, Quote } from "lucide-react";
import api, { formatApiError } from "../lib/api";

const PROGRAMS = [
  { icon: Palette, color: "#FFD4C7", title: "Creative Arts", desc: "Painting, crafts and storytelling that spark imagination." },
  { icon: BookOpen, color: "#A7E8D0", title: "Early Literacy", desc: "Phonics, reading circles and pre-writing fun." },
  { icon: Music, color: "#FDF3B8", title: "Music & Movement", desc: "Singing, dancing and rhythmic play every day." },
  { icon: Sparkles, color: "#E6DDFA", title: "STEM Discovery", desc: "Hands-on science experiments and number games." },
];

const TEACHERS = [
  { name: "Ms. Sarah Johnson", role: "Pre-K Lead", img: "https://images.pexels.com/photos/8423062/pexels-photo-8423062.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" },
  { name: "Mr. David Chen", role: "Kindergarten Teacher", img: "https://images.pexels.com/photos/5212675/pexels-photo-5212675.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" },
];

const TESTIMONIALS = [
  { name: "Emma W.", role: "Parent of Lily, 4", text: "LumiKids transformed my daughter's confidence. The teachers truly care." },
  { name: "Michael B.", role: "Parent of Noah, 3", text: "The daily updates and friendly atmosphere put us at ease every day." },
  { name: "Jessica T.", role: "Parent of Sophia, 3", text: "I love how creativity is woven into every single activity. A magical place!" },
];

export default function Landing() {
  const [showEnroll, setShowEnroll] = useState(false);
  return (
    <div className="bg-[#FFFAF5] text-slate-900 font-body overflow-x-hidden">
      {/* Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 border-b border-white/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2" data-testid="logo-home">
            <div className="w-10 h-10 rounded-2xl bg-[#FF8C73] flex items-center justify-center">
              <Sun className="text-white" strokeWidth={2.5} size={22} />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-xl leading-none">LumiKids</h2>
              <p className="text-xs text-slate-500">Academy</p>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-700">
            <a href="#about" className="hover:text-[#FF8C73] transition">About</a>
            <a href="#programs" className="hover:text-[#FF8C73] transition">Programs</a>
            <a href="#teachers" className="hover:text-[#FF8C73] transition">Teachers</a>
            <a href="#gallery" className="hover:text-[#FF8C73] transition">Gallery</a>
            <a href="#contact" className="hover:text-[#FF8C73] transition">Contact</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              data-testid="login-btn"
              className="hidden sm:inline-flex rounded-full px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-[#FFFAF5] transition"
            >
              Login
            </Link>
            <button
              data-testid="enroll-btn-nav"
              onClick={() => setShowEnroll(true)}
              className="btn-primary text-sm"
            >
              Enroll Now
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-40 -right-32 w-[36rem] h-[36rem] rounded-full bg-[#FFD4C7] blur-3xl opacity-60" />
          <div className="absolute top-40 -left-32 w-[30rem] h-[30rem] rounded-full bg-[#C4E6FA] blur-3xl opacity-60" />
        </div>
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FDF3B8] text-sm font-bold text-slate-700 mb-6">
              <Star size={14} className="fill-[#FF8C73] text-[#FF8C73]" /> Now enrolling for Fall 2026
            </div>
            <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-tight">
              Where little<br />stars learn to<br />
              <span className="text-[#FF8C73]">shine bright</span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 max-w-md leading-relaxed">
              A play-based kindergarten where curiosity is celebrated, friendships blossom, and every child
              discovers their own brilliance.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                data-testid="enroll-btn-hero"
                onClick={() => setShowEnroll(true)}
                className="btn-primary inline-flex items-center gap-2"
              >
                Enroll Your Child <ArrowRight size={18} />
              </button>
              <a href="#programs" className="btn-secondary">Explore Programs</a>
            </div>
            <div className="mt-10 flex items-center gap-8 text-sm">
              <div>
                <p className="font-heading text-3xl font-semibold text-slate-900">200+</p>
                <p className="text-slate-500">Happy Kids</p>
              </div>
              <div>
                <p className="font-heading text-3xl font-semibold text-slate-900">15</p>
                <p className="text-slate-500">Caring Teachers</p>
              </div>
              <div>
                <p className="font-heading text-3xl font-semibold text-slate-900">12yrs</p>
                <p className="text-slate-500">Of joyful learning</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -top-6 -left-6 w-32 h-32 rounded-3xl bg-[#FDF3B8] -rotate-6 animate-float" />
            <div className="absolute -bottom-8 -right-4 w-28 h-28 rounded-3xl bg-[#A7E8D0] rotate-12 animate-float" style={{ animationDelay: "1s" }} />
            <img
              src="https://images.unsplash.com/photo-1723750592050-e973050b6ee1?crop=entropy&cs=srgb&fm=jpg&w=940&q=85"
              alt="Happy child"
              className="relative rounded-[2.5rem] shadow-2xl object-cover w-full h-[28rem] md:h-[32rem]"
            />
            <div className="absolute -bottom-6 left-6 bg-white rounded-3xl p-4 shadow-xl flex items-center gap-3 max-w-[80%]">
              <div className="w-12 h-12 rounded-2xl bg-[#FFD4C7] flex items-center justify-center">
                <Heart className="text-[#FF8C73]" fill="#FF8C73" size={20} />
              </div>
              <div>
                <p className="font-heading font-semibold text-sm">Loved by parents</p>
                <p className="text-xs text-slate-500">★★★★★ 4.9 / 5 rating</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="max-w-7xl mx-auto px-6 py-20 md:py-24">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <img
            src="https://images.unsplash.com/photo-1560130958-0ea787c275de?crop=entropy&cs=srgb&fm=jpg&w=940&q=85"
            alt="Children learning"
            className="rounded-[2rem] w-full h-[28rem] object-cover"
          />
          <div>
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#FF8C73] mb-4">About LumiKids</p>
            <h2 className="font-heading text-4xl md:text-5xl font-semibold leading-tight">
              A nurturing space where childhood is honored
            </h2>
            <p className="mt-6 text-slate-600 leading-relaxed text-lg">
              Founded in 2014, LumiKids Academy combines the magic of play with thoughtful early-learning practices.
              Our cozy classrooms, sunlit garden, and small group sizes mean every child gets the attention they deserve.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                "Low 1:6 teacher-to-child ratio",
                "Daily outdoor adventures and nature time",
                "Healthy meals prepared in our kitchen",
                "Weekly progress updates for parents",
              ].map((t) => (
                <li key={t} className="flex items-center gap-3 text-slate-700">
                  <span className="w-7 h-7 rounded-full bg-[#A7E8D0] flex items-center justify-center text-[#0F4C35] font-bold">✓</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section id="programs" className="bg-white py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#FF8C73] mb-4">Our Programs</p>
            <h2 className="font-heading text-4xl md:text-5xl font-semibold">Days filled with discovery</h2>
            <p className="mt-4 text-slate-600 text-lg">A balance of structured learning and free play, tailored to every age group.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROGRAMS.map((p) => (
              <div
                key={p.title}
                data-testid={`program-${p.title.toLowerCase().replace(/\s+/g, "-")}`}
                className="card-soft p-8 hover:-translate-y-2 transition-transform duration-300"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6" style={{ background: p.color }}>
                  <p.icon className="text-slate-800" strokeWidth={2.5} size={26} />
                </div>
                <h3 className="font-heading text-xl font-semibold mb-2">{p.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Teachers */}
      <section id="teachers" className="max-w-7xl mx-auto px-6 py-20 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#FF8C73] mb-4">Meet the Team</p>
          <h2 className="font-heading text-4xl md:text-5xl font-semibold">Teachers who truly care</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {TEACHERS.map((t) => (
            <div key={t.name} className="card-soft overflow-hidden">
              <img src={t.img} alt={t.name} className="w-full h-72 object-cover" />
              <div className="p-6">
                <h3 className="font-heading text-xl font-semibold">{t.name}</h3>
                <p className="text-[#FF8C73] font-semibold text-sm">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Gallery */}
      <section id="gallery" className="bg-white py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#FF8C73] mb-4">Gallery</p>
            <h2 className="font-heading text-4xl md:text-5xl font-semibold">A glimpse of our days</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&q=80",
              "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=600&q=80",
              "https://images.unsplash.com/photo-1587616211892-f743fcca64f5?w=600&q=80",
              "https://images.unsplash.com/photo-1567057419565-4349c49d8a04?w=600&q=80",
              "https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=600&q=80",
              "https://images.unsplash.com/photo-1602030638412-bb8dcc0bc8b0?w=600&q=80",
              "https://images.unsplash.com/photo-1607453998774-d533f65dac99?w=600&q=80",
              "https://images.unsplash.com/photo-1543351611-58f69d7c1781?w=600&q=80",
            ].map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`Gallery ${i + 1}`}
                className={`rounded-2xl object-cover w-full ${i % 3 === 0 ? "h-64" : "h-48"} hover:scale-105 transition-transform duration-500`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-24">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#FF8C73] mb-4">Testimonials</p>
          <h2 className="font-heading text-4xl md:text-5xl font-semibold">Loved by families</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={t.name}
              className="card-soft p-8"
              style={{ background: i === 1 ? "#FDF3B8" : "white" }}
            >
              <Quote className="text-[#FF8C73] mb-4" size={28} />
              <p className="text-slate-700 leading-relaxed mb-6">{t.text}</p>
              <div>
                <p className="font-heading font-semibold">{t.name}</p>
                <p className="text-sm text-slate-500">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact / CTA */}
      <section id="contact" className="bg-gradient-to-br from-[#FFD4C7] to-[#FDF3B8] py-20 md:py-24">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="font-heading text-4xl md:text-5xl font-semibold mb-4">Ready to join the LumiKids family?</h2>
          <p className="text-slate-700 text-lg mb-8 max-w-2xl mx-auto">
            Book a tour or fill out our enrollment form. We can't wait to meet your little one.
          </p>
          <button
            data-testid="enroll-btn-cta"
            onClick={() => setShowEnroll(true)}
            className="btn-primary inline-flex items-center gap-2 text-base px-8 py-4"
          >
            Start Enrollment <ArrowRight size={18} />
          </button>
          <div className="mt-12 grid sm:grid-cols-3 gap-6 text-left max-w-3xl mx-auto">
            <div className="bg-white/60 backdrop-blur p-6 rounded-2xl flex items-start gap-3">
              <Phone className="text-[#FF8C73] mt-1" /><div><p className="font-heading font-semibold">Call us</p><p className="text-slate-600 text-sm">(555) 123-4567</p></div>
            </div>
            <div className="bg-white/60 backdrop-blur p-6 rounded-2xl flex items-start gap-3">
              <Mail className="text-[#FF8C73] mt-1" /><div><p className="font-heading font-semibold">Email</p><p className="text-slate-600 text-sm">hello@lumikids.com</p></div>
            </div>
            <div className="bg-white/60 backdrop-blur p-6 rounded-2xl flex items-start gap-3">
              <MapPin className="text-[#FF8C73] mt-1" /><div><p className="font-heading font-semibold">Visit us</p><p className="text-slate-600 text-sm">123 Sunshine Lane</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Sun className="text-[#FF8C73]" size={24} />
            <p className="font-heading font-semibold text-white text-lg">LumiKids Academy</p>
          </div>
          <p className="text-sm">© 2026 LumiKids Academy. Where little stars shine bright.</p>
        </div>
      </footer>

      {showEnroll && <EnrollmentModal onClose={() => setShowEnroll(false)} />}
    </div>
  );
}

function EnrollmentModal({ onClose }) {
  const [form, setForm] = useState({
    parent_name: "", parent_email: "", phone: "", child_name: "", child_age: "", preferred_class: "", notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/public/enroll", { ...form, child_age: Number(form.child_age) });
      setSubmitted(true);
      toast.success("Enrollment submitted!");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-up">
      <div className="bg-white rounded-[2rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 md:p-10 relative">
        <button
          data-testid="enroll-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
        >×</button>
        {submitted ? (
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-[#A7E8D0] flex items-center justify-center mb-6">
              <Star className="text-[#0F4C35] fill-[#0F4C35]" size={36} />
            </div>
            <h3 className="font-heading text-3xl font-semibold mb-3">Enrollment Submitted!</h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Thank you! We've sent a confirmation email and our admissions team will review your application within 2-3 business days.
            </p>
            <button onClick={onClose} className="btn-primary" data-testid="enroll-success-close">Got it</button>
          </div>
        ) : (
          <>
            <h3 className="font-heading text-3xl font-semibold mb-2">Start Enrollment</h3>
            <p className="text-slate-500 mb-6">We'll email you within 2-3 days with next steps.</p>
            <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4" data-testid="enrollment-form">
              <Input label="Parent Name" required value={form.parent_name} onChange={(v) => setForm({ ...form, parent_name: v })} testid="enroll-parent-name" />
              <Input label="Parent Email" type="email" required value={form.parent_email} onChange={(v) => setForm({ ...form, parent_email: v })} testid="enroll-parent-email" />
              <Input label="Phone Number" required value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} testid="enroll-phone" />
              <Input label="Child Name" required value={form.child_name} onChange={(v) => setForm({ ...form, child_name: v })} testid="enroll-child-name" />
              <Input label="Child Age" type="number" min="1" max="12" required value={form.child_age} onChange={(v) => setForm({ ...form, child_age: v })} testid="enroll-child-age" />
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Preferred Class</label>
                <select
                  data-testid="enroll-preferred-class"
                  value={form.preferred_class}
                  onChange={(e) => setForm({ ...form, preferred_class: e.target.value })}
                  className="w-full rounded-2xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-[#A7E8D0] focus:border-transparent px-4 py-3 outline-none"
                >
                  <option value="">No preference</option>
                  <option value="Little Tots">Little Tots (2-3 yrs)</option>
                  <option value="Sunshine Stars">Sunshine Stars (3-4 yrs)</option>
                  <option value="Rainbow Explorers">Rainbow Explorers (4-5 yrs)</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Notes (optional)</label>
                <textarea
                  data-testid="enroll-notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  placeholder="Tell us about your child..."
                  className="w-full rounded-2xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-[#A7E8D0] focus:border-transparent px-4 py-3 outline-none resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                data-testid="enroll-submit-btn"
                className="btn-primary sm:col-span-2 mt-2 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Enrollment"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required, min, max, testid }) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">{label}</label>
      <input
        type={type}
        required={required}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testid}
        className="w-full rounded-2xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-[#A7E8D0] focus:border-transparent px-4 py-3 outline-none"
      />
    </div>
  );
}
