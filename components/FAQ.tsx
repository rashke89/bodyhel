'use client';

import { useState } from 'react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'Kakva je bezbednost podataka?',
      answer:
        'BodyHel koristi HTTPS/TLS enkripciju, JWT/OAuth2 autentikaciju, enkripciju podataka u mirovanju, role-based access control i audit logove. Sistem je usklađen sa lokalnim propisima o zaštiti ličnih podataka.',
    },
    {
      question: 'Kako funkcioniše migracija podataka?',
      answer:
        'Naš tim će vam pomoći u procesu migracije podataka iz postojećih sistema. Obezbeđujemo sigurnu i kontrolisanu migraciju sa minimalnim prekidom rada.',
    },
    {
      question: 'Koje integracije su dostupne?',
      answer:
        'BodyHel podržava integracije sa državnim servisima (RFZO, IZJZS), laboratorijskim sistemima (LIS/RIS) i drugim zdravstvenim informacionim sistemima preko secure API-ja.',
    },
    {
      question: 'Da li je sistem skalabilan?',
      answer:
        'Da, BodyHel je dizajniran kao modularni monolit koji se može skalirati horizontalno. MongoDB klaster se može proširiti prema potrebama, a moduli se mogu izdvojiti u mikroservise kada je potrebno.',
    },
    {
      question: 'Kakva je podrška za korisnike?',
      answer:
        'Pružamo email podršku za osnovni paket, prioritetnu podršku za napredni paket i dedicated support za premium paket. Takođe obezbeđujemo obuku korisnika.',
    },
    {
      question: 'Da li se može prilagoditi našim potrebama?',
      answer:
        'Da, BodyHel nudi konfigurabilne obrasce i mogućnost custom integracija. Premium paket uključuje dodatne opcije prilagođavanja.',
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="section-padding bg-white">
      <div className="section-container">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-dark mb-4">
            Često postavljana pitanja
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Odgovori na najčešća pitanja o BodyHel platformi
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white border-2 border-primary-light rounded-lg overflow-hidden shadow-md"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full text-left p-6 flex justify-between items-center hover:bg-primary-light transition-colors duration-200"
                >
                  <span className="text-xl font-bold text-primary-dark pr-4">
                    {faq.question}
                  </span>
                  <span className="text-primary text-2xl font-bold flex-shrink-0">
                    {openIndex === index ? '−' : '+'}
                  </span>
                </button>
                {openIndex === index && (
                  <div className="p-6 pt-0 text-gray-700 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}