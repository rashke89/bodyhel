export default function Features() {
  const features = [
    {
      title: 'Zakazivanje i upravljanje terminima',
      description:
        'Modul za zakazivanje pregleda po lekarima/ordinacijama sa grafičkim prikazom, filtrima, brzim unosom pacijenata, automatskim zakazivanjem i pomeranjem termina.',
      icon: '📅',
    },
    {
      title: 'Elektronski zdravstveni karton (EHR)',
      description:
        'Čuvanje medicinskih upozorenja, dijagnoza (ICD-10), recepata, laboratorijskih rezultata, dokumenata, demografskih podataka; napredna pretraga i konfigurabilni obrasci.',
      icon: '📋',
    },
    {
      title: 'Telemedicina',
      description:
        'Video/audio konsultacije između pacijenata i lekara, zakazivanje on-line termina i automatsko logovanje posete u EHR. Podržava prenos vitalnih podataka i čuvanje snimaka.',
      icon: '📹',
    },
    {
      title: 'Pacijent-portal',
      description:
        'Siguran portal kroz koji pacijenti mogu pristupati medicinskim dokumentima, zakazivati termine, slati poruke lekarima i pregledati edukativne materijale.',
      icon: '👤',
    },
    {
      title: 'Ambulantni i stacionarni pregledi',
      description:
        'Specijalistički pregledi svih oblasti, kurativni i sistematski pregledi, vođenje stomatoloških kartona i stanja zuba; modul stacionarnog liječenja.',
      icon: '🏥',
    },
    {
      title: 'Administracija i izveštavanje',
      description:
        'Upravljanje korisničkim ulogama, rasporedima, pravima pristupa i internim porukama; generisanje statističkih, kapitacionih i grafičkih izveštaja.',
      icon: '📊',
    },
  ];

  return (
    <section className="section-padding bg-white">
      <div className="section-container">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-dark mb-4">
            Funkcionalnosti platforme
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Kompletan sistem koji objedinjuje sve potrebne funkcije za
            upravljanje zdravstvenim ustanovama
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-primary hover:shadow-xl transition-shadow duration-300"
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-primary-dark mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}