import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getPublicSettings } from "../../api/settings";

export default function Footer() {
  const { data: settings } = useQuery({
    queryKey: ["public-settings"],
    queryFn: getPublicSettings,
  });

  const hotelName = settings?.hotel_name || "Sri ASK Residency";

  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-serif text-white text-xl font-bold mb-3">{hotelName}</h3>
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
              <li>
                <a href="/manage" className="hover:text-white transition-colors">
                  Staff Login
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>📍 {settings?.hotel_address || "1, Karaya Rayappa, Thevar Street, Sulur, Coimbatore - 641402"}</li>
              <li>📞 {settings?.hotel_phone || "+91 9444551122"}</li>
              <li>✉️ {settings?.hotel_email || "sriaskresidency@gmail.com"}</li>
              <li>🕐 Check-in: {settings?.check_in_time?.slice(0, 5) || "12:00"} | Check-out: {settings?.check_out_time?.slice(0, 5) || "12:00"}</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-xs">
          © {new Date().getFullYear()} {hotelName}. Built by HaizoTech.
        </div>
      </div>
    </footer>
  );
}