export default function Benefits() {
  const benefits = [
    {
      title: 'Digitalizacija zdravstvenih procesa',
      description:
        'Kompletna online podrška za zakazivanje, evidenciju i analizu. Eliminišite papirnu dokumentaciju i ubrzajte radne procese.',
    },
    {
      title: 'Poboljšanje dostupnosti i efikasnosti',
      description:
        'Telemedicina i pacijent-portal smanjuju broj poseta i ubrzavaju komunikaciju između pacijenata i zdravstvenih radnika.',
    },
    {
      title: 'Povećanje sigurnosti i usklađenosti',
      description:
        'Role-based pristup, enkripcija i usklađenost sa lokalnim propisima za zaštitu ličnih podataka. Kompletna bezbednost medicinskih podataka.',
    },
    {
      title: 'Skalabilnost i modularnost',
      description:
        'Arhitektura omogućava dodavanje novih funkcija (AI analitika, integracija sa državnim sistemima). Next.js 16 sa poboljšanim performansama.',
    },
  ];

  return (
    <section className="section-padding bg-background-light">
      <div className="section-container">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-dark mb-4">
            Prednosti BodyHel platforme
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Zašto izabrati BodyHel za vašu zdravstvenu ustanovu
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="gradient-light p-8 rounded-xl border-l-4 border-primary shadow-md"
            >
              <h3 className="text-2xl font-bold text-primary-dark mb-4">
                {benefit.title}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}