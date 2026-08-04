import AmbientBackground from '../components/AmbientBackground';
import Footer from '../components/Footer';
import Header from '../components/Header';

export default function SiteLayout({ children }) {
  return (
    <div className="antialiased selection:bg-primary-500/30 overflow-x-hidden">
      <AmbientBackground />
      <Header />
      {children}
      <Footer />
    </div>
  );
}
