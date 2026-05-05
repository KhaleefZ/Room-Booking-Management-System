export default function About() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gray-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="font-serif text-5xl font-bold mb-4">About Us</h1>
          <p className="text-gray-300 text-lg">A legacy of hospitality and warmth</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="font-serif text-3xl font-bold text-gray-900 mb-4">Our Story</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Founded with a passion for exceptional hospitality, HotelRBMS has been welcoming
              guests from around the world. We believe every stay should be a memory worth keeping.
            </p>
            <p className="text-gray-600 leading-relaxed">
              From our meticulously designed rooms to our world-class amenities, every detail
              is crafted to ensure your comfort and satisfaction.
            </p>
          </div>
          <div className="bg-brand-50 rounded-2xl p-8 text-center">
            <div className="grid grid-cols-2 gap-6">
              {[
                { value: "10+", label: "Years of Service" },
                { value: "50+", label: "Rooms" },
                { value: "10K+", label: "Happy Guests" },
                { value: "4.9★", label: "Average Rating" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-bold text-brand-600">{s.value}</div>
                  <div className="text-sm text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-3xl font-bold text-gray-900 mb-8 text-center">Why Choose Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "🏆", title: "Award Winning", desc: "Recognised for excellence in hospitality and guest satisfaction." },
              { icon: "🌿", title: "Eco Friendly", desc: "Committed to sustainable practices for a greener tomorrow." },
              { icon: "❤️", title: "Guest First", desc: "Every decision we make puts our guests' comfort first." },
            ].map((c) => (
              <div key={c.title} className="card p-6 text-center">
                <div className="text-4xl mb-4">{c.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{c.title}</h3>
                <p className="text-gray-500 text-sm">{c.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}