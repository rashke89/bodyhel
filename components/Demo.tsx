export default function Demo() {
  return (
    <section className="section-padding bg-white">
      <div className="section-container">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-dark mb-4">
            Demo i Screenshot
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Pogledajte kako BodyHel platforma funkcioniše u praksi
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-primary-light to-background-light rounded-2xl p-8 md:p-12 shadow-xl">
            <div className="bg-white rounded-lg p-8 text-center">
              <div className="text-6xl mb-6">🖥️</div>
              <h3 className="text-2xl font-bold text-primary-dark mb-4">
                Demo video i screenshot
              </h3>
              <p className="text-gray-600 mb-6">
                Prikaz korisničkog interfejsa i telemedicinske konsultacije će
                biti dostupan uskoro.
              </p>
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-400">Video placeholder</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}