import { Link } from "react-router-dom";

export default function BookingConfirm() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-16 px-4">
      <div className="max-w-md w-full card p-10 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="font-serif text-3xl font-bold text-gray-900 mb-3">
          Booking Confirmed!
        </h1>
        <p className="text-gray-500 mb-6">
          Your payment was successful and your room is reserved.
          A confirmation email has been sent to your inbox.
        </p>

        <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-8">
          <p className="text-green-700 text-sm font-medium">
            ✓ Payment received
          </p>
          <p className="text-green-700 text-sm mt-1">
            ✓ Confirmation email sent
          </p>
          <p className="text-green-700 text-sm mt-1">
            ✓ Room reserved for you
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link to="/rooms" className="btn-primary">
            Browse More Rooms
          </Link>
          <Link to="/" className="btn-secondary">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}