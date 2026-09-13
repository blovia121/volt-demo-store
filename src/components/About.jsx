import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Shield, Headphones } from 'lucide-react';

const AboutSection = () => {
  const features = [
    {
      icon: Zap,
      title: 'Fast Delivery',
      description: 'Free shipping on orders over $50, with most packages arriving in 3-5 business days.'
    },
    {
      icon: Shield,
      title: '1-Year Warranty',
      description: 'Every product comes with a full manufacturer warranty and a 30-day return policy.'
    },
    {
      icon: Headphones,
      title: 'AI-Powered Support',
      description: 'Our smart support assistant answers your questions instantly, 24 hours a day.'
    }
  ];

  return (
    <section id="about" className="py-20 bg-white/50 backdrop-blur-sm">
      <section className="container mx-auto px-4">
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-light text-gray-800 mb-4 underline decoration-orange-500">
            About Volt
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
            Volt is a modern electronics store offering premium gadgets and
            accessories at fair prices. We combine a curated product range with
            an AI-powered support assistant, so you get fast answers and fast
            shipping — every time.
          </p>
        </motion.section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.section
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="text-center p-6"
            >
              <motion.section
                whileHover={{ scale: 1.1 }}
                className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <feature.icon className="w-8 h-8 text-orange-500" />
              </motion.section>
              <h3 className="text-xl font-light text-gray-800 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.section>
          ))}
        </section>

        {/* Stats */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        >
          <section>
            <section className="text-3xl font-light text-orange-500 mb-2">1,200+</section>
            <section className="text-gray-600">Happy Customers</section>
          </section>
          <section>
            <section className="text-3xl font-light text-orange-500 mb-2">50+</section>
            <section className="text-gray-600">Products</section>
          </section>
          <section>
            <section className="text-3xl font-light text-orange-500 mb-2">4.8★</section>
            <section className="text-gray-600">Average Rating</section>
          </section>
          <section>
            <section className="text-3xl font-light text-orange-500 mb-2">24/7</section>
            <section className="text-gray-600">AI Support</section>
          </section>
        </motion.section>
      </section>
    </section>
  );
};

export default AboutSection;