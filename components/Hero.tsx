export default function Hero() {
  return (
    <section className="gradient-primary text-white section-padding">
      <div className="section-container">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
            BodyHel
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-95">
            Digitalno zdravstvo na dohvat ruke
          </p>
          <p className="text-lg md:text-xl mb-10 opacity-90 max-w-2xl mx-auto">
            Modernа web-bazirana platforma za upravljanje zdravstvom i pružanje
            digitalnih zdravstvenih usluga. Kompletan sistem za zakazivanje,
            elektronski zdravstveni karton, telemedicinu i pacijent-portal.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#contact" className="btn-primary">
              Zatraži demo
            </a>
            <a
              href="#contact"
              className="btn-secondary bg-white/10 border-white text-white hover:bg-white/20"
            >
              Prijavi se
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
