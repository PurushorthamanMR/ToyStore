import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="hidden lg:block bg-wa-teal dark:bg-black text-gray-200 dark:text-gray-400 mt-12 dark:border-t dark:border-wa-green/30">
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 sm:grid-cols-4 gap-6 text-sm">
        <div>
          <h3 className="text-white font-bold mb-2">City Cycle Stores Toys</h3>
          <p>Sri Lanka's fun destination for toys, ride-ons, and kids' essentials.</p>
        </div>
        <div>
          <h3 className="text-white font-bold mb-2">Customer Care</h3>
          <ul className="space-y-1">
            <li>Terms &amp; Conditions</li>
            <li>Return Policy</li>
            <li>Privacy Policy</li>
          </ul>
        </div>
        <div>
          <h3 className="text-white font-bold mb-2">Sell With Us</h3>
          <Link to="/apply-seller" className="hover:underline">
            Become a Seller
          </Link>
        </div>
        <div>
          <h3 className="text-white font-bold mb-2">Contact</h3>
          <p>Colombo, Sri Lanka</p>
          <p>Phone: 011 234 5678</p>
          <p>Email: info@citycyclestores.lk</p>
        </div>
      </div>
      <div className="text-center text-xs py-3 border-t border-white/10 dark:border-wa-green/20">
        &copy; {new Date().getFullYear()} City Cycle Stores Toys. All rights reserved.
      </div>
    </footer>
  );
}
