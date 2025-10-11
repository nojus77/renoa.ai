export default function HowItWorks() {
  const steps = [
    {
      number: "1",
      title: "Tell Us Your Needs",
      description:
        "Share your home improvement project details and preferences. Our AI analyzes your requirements.",
      icon: "📝",
    },
    {
      number: "2",
      title: "Get Matched Instantly",
      description:
        "Our AI matches you with 2-3 top-rated local service providers based on your specific needs.",
      icon: "🤝",
    },
    {
      number: "3",
      title: "Connect & Hire",
      description:
        "Review provider profiles, ratings, and pricing. Connect directly and hire with confidence.",
      icon: "✅",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get connected with the perfect service provider in three simple
            steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100"
            >
              {/* Step Number Badge */}
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                {step.number}
              </div>

              {/* Icon */}
              <div className="text-5xl mb-4 mt-2">{step.icon}</div>

              {/* Content */}
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {step.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">{step.description}</p>

              {/* Connection Line (except for last item) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary-300 to-transparent"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

