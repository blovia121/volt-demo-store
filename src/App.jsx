import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { setProducts } from './store';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductGrid from './components/ProductGrid';
import About from './components/About';
import Contact from './components/Contact';
import CartSidebar from './components/CartSidebar';
import ProductModal from './components/ProductModal';
import CheckoutModal from './components/CheckoutModal';
import Footer from './components/Footer';
import ChatWidget from './components/ChatWidget';
import Dashboard from './components/Dashboard';
import { products } from './data/product';

function AppContent() {
  const [route, setRoute] = useState(window.location.hash);

  // Listen for hash changes (e.g. #dashboard, or back to #)
  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Load products once
  useEffect(() => {
    store.dispatch(setProducts(products));
  }, []);

  // Route: #dashboard shows the analytics page
  if (route === '#dashboard') {
    return <Dashboard />;
  }

  // Default: the store
  return (
    <section className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      <Navbar />
      <section id="home">
        <Hero />
      </section>

      <About />
      <section id="catalog">
        <section className="container mx-auto px-4 py-8">
          <ProductGrid />
        </section>
      </section>
      <Contact />

      <Footer />
      <CartSidebar />
      <ProductModal />
      <CheckoutModal />
      <ChatWidget />
    </section>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;