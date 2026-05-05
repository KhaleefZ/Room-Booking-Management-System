export default function BookingSteps({ current }) {
  const steps = [
    { n: 1, label: "Select Dates" },
    { n: 2, label: "Guest Details" },
    { n: 3, label: "Payment" },
  ];

  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((step, i) => (
        <div key={step.n} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                current > step.n
                  ? "bg-brand-600 text-white"
                  : current === step.n
                  ? "bg-brand-600 text-white ring-4 ring-brand-100"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {current > step.n ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step.n
              )}
            </div>
            <span
              className={`mt-1 text-xs font-medium ${
                current >= step.n ? "text-brand-600" : "text-gray-400"
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-16 md:w-24 h-0.5 mb-4 mx-2 transition-colors ${
                current > step.n ? "bg-brand-600" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}