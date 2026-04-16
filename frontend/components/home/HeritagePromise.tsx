'use client';

import { motion } from 'framer-motion';

const PILLARS = [
  {
    title: 'BIS Hallmark First',
    desc: 'Every gold piece is BIS certified with transparent billing and weight details.',
  },
  {
    title: 'Karigar Craftsmanship',
    desc: 'Hand-finished by skilled artisans to preserve detail, balance, and comfort.',
  },
  {
    title: 'Lifetime Relationship',
    desc: 'From festive gifting to bridal milestones, we are your jeweller for every chapter.',
  },
];

export default function HeritagePromise() {
  return (
    <section className="py-16 px-7 bg-gradient-to-b from-[#0d0b08] via-[#12100b] to-black">
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="text-gold text-[13px] tracking-[5px] uppercase mb-2 font-light" style={{ fontFamily: 'Cormorant Garamond,serif' }}>
            Balaji Promise
          </div>
          <h2 className="font-playfair text-white font-bold mb-3" style={{ fontSize: 'clamp(26px,3.5vw,40px)' }}>
            Tradition You Can Trust
          </h2>
          <div className="gold-line w-16 mx-auto" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PILLARS.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="border border-gold/30 bg-black/25 p-7 rounded-sm"
            >
              <div className="text-gold text-[11px] tracking-[3px] uppercase mb-2">Assurance 0{idx + 1}</div>
              <h3 className="font-playfair text-white text-xl mb-2">{item.title}</h3>
              <p className="text-white/70 leading-relaxed" style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 17 }}>
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
