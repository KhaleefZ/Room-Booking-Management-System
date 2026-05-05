import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-serif text-white text-xl font-bold mb-3">HotelRBMS</h3>
            <p className="text-sm leading-relaxed">
              Experience comfort and luxury in the heart of the city.
              Your perfect stay awaits.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {[
                { to: "/rooms", label: "Our Rooms" },
                { to: "/gallery", label: "Gallery" },
                { to: "/about", label: "About Us" },
                { to: "/contact", label: "Contact" },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>📍 123 Hotel Street, Coimbatore</li>
              <li>📞 +91 98765 43210</li>
              <li>✉️ info@hotelrbms.com</li>
              <li>🕐 Check-in: 2:00 PM | Check-out: 11:00 AM</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-xs">
          © {new Date().getFullYear()} HotelRBMS. Built by HaizoTech.
        </div>
      </div>
    </footer>
  );
}