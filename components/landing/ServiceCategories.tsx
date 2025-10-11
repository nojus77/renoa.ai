export default function ServiceCategories() {
  const categories = [
    {
      name: "Landscaping",
      icon: "🌳",
      description: "Lawn care, garden design, irrigation",
    },
    {
      name: "Remodeling",
      icon: "🏗️",
      description: "Kitchen, bathroom, home additions",
    },
    {
      name: "Roofing",
      icon: "🏠",
      description: "Repairs, replacement, inspections",
    },
    {
      name: "Fencing",
      icon: "🚧",
      description: "Installation, repair, custom designs",
    },
    {
      name: "HVAC",
      icon: "❄️",
      description: "Heating, cooling, maintenance",
    },
    {
      name: "Plumbing",
      icon: "🔧",
      description: "Repairs, installation, emergencies",
    },
    {
      name: "Painting",
      icon: "🎨",
      description: "Interior, exterior, commercial",
    },
    {
      name: "Flooring",
      icon: "📐",
      description: "Hardwood, tile, carpet installation",
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            All Home Services in One Place
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Whatever your home improvement needs, we connect you with trusted
            professionals
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {categories.map((category, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer group hover:-translate-y-1 border border-gray-100"
            >
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                {category.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {category.name}
              </h3>
              <p className="text-sm text-gray-600">{category.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

