export default function Footer() {
  return (
    <footer className="bg-primary-dark text-white py-12">
      <div className="section-container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold mb-4">BodyHel</h3>
            <p className="text-white/80 mb-4">
              Digitalno zdravstvo na dohvat ruke
            </p>
            <p className="text-white/70 text-sm">
              Modernа web-bazirana platforma za upravljanje zdravstvom i
              pružanje digitalnih zdravstvenih usluga.
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-4">Linkovi</h4>
            <ul className="space-y-2 text-white/80">
              <li>
                <a href="#contact" className="hover:text-white transition-colors">
                  Kontakt
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  O nama
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Partneri
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Sertifikati
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Informacije</h4>
            <ul className="space-y-2 text-white/80">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Zaštita podataka
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Uslovi korišćenja
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Podrška
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 pt-8 text-center text-white/70 text-sm">
          <p>
            &copy; {new Date().getFullYear()} BodyHel. Sva prava zadržana.
          </p>
        </div>
      </div>
    </footer>
  );
}