export default function Pricing() {
  const plans = [
    {
      name: 'Osnovni',
      price: 'Kontaktirajte nas',
      features: [
        'Zakazivanje pregleda',
        'Elektronski zdravstveni karton (EHR)',
        'Osnovna administracija',
        'Izveštavanje',
        'Email podrška',
      ],
      popular: false,
    },
    {
      name: 'Napredni',
      price: 'Kontaktirajte nas',
      features: [
        'Sve iz osnovnog paketa',
        'Napredno izveštavanje',
        'Integracije sa laboratorijskim sistemima',
        'Prioritetna podrška',
        'Obuka korisnika',
      ],
      popular: true,
    },
    {
      name: 'Premium',
      price: 'Kontaktirajte nas',
      features: [
        'Sve iz naprednog paketa',
        'Telemedicina (video konsultacije)',
        'Pacijent-portal',
        'Integracija sa državnim sistemima',
        'Dedicated support',
        'Custom integracije',
      ],
      popular: false,
    },
  ];

  return (
    <section className="section-padding bg-background-light">
      <div className="section-container">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-dark mb-4">
            Planovi i cene
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Izaberite paket koji najbolje odgovara vašoj zdravstvenoj ustanovi
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`bg-white rounded-2xl p-8 shadow-lg ${
                plan.popular
                  ? 'border-4 border-primary transform scale-105'
                  : 'border-2 border-primary-light'
              }`}
            >
              {plan.popular && (
                <div className="bg-primary text-white text-center py-2 rounded-t-lg -mt-8 -mx-8 mb-4">
                  <span className="font-bold">Najpopularniji</span>
                </div>
              )}
              <h3 className="text-2xl font-bold text-primary-dark mb-2">
                {plan.name}
              </h3>
              <div className="text-3xl font-bold text-primary mb-6">
                {plan.price}
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#contact"
                className={`block text-center py-3 rounded-lg font-bold transition-colors duration-300 ${
                  plan.popular
                    ? 'btn-primary'
                    : 'bg-primary-light text-primary-dark hover:bg-primary hover:text-white'
                }`}
              >
                Kontaktirajte nas
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}