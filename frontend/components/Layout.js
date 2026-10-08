import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Layout({ children }) {
  const router = useRouter();

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <span className="text-primary font-bold text-xl">MyTrip</span>
            </Link>

            <nav className="hidden md:flex space-x-6">
              <Link href="/" className="text-gray-600 hover:text-primary transition-colors">Home</Link>
              <Link href="/flights" className="text-gray-600 hover:text-primary transition-colors">Flights</Link>
              <Link href="/hotels" className="text-gray-600 hover:text-primary transition-colors">Hotels</Link>
              <Link href="/bookings" className="text-gray-600 hover:text-primary transition-colors">Bookings</Link>
              <Link href="/profile" className="text-gray-600 hover:text-primary transition-colors">Profile</Link>
            </nav>

            <div className="flex items-center space-x-4">
              {/* User avatar placeholder */}
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-white text-sm">
                U
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-160px)]">{children}</main>

      {/* Footer */}
      <footer className="bg-dark text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">MyTrip</h3>
              <p className="text-gray-300">
                Your trusted travel companion for booking flights, hotels, and experiences worldwide.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>About Us</li>
                <li>Careers</li>
                <li>Press</li>
                <li>Blog</li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>FAQ</li>
                <li>Travel Insurance</li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Terms of Service</li>
                <li>Privacy Policy</li>
                <li>Cookie Policy</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-700 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} MyTrip. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}