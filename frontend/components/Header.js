import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-xl font-bold text-primary">
              MyTrip
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/flights" className="text-sm text-gray-600 hover:text-primary">Flights</Link>
            <Link href="/hotels" className="text-sm text-gray-600 hover:text-primary">Hotels</Link>
            <Link href="/bookings" className="text-sm text-gray-600 hover:text-primary">Bookings</Link>
            <Link href="/recommendations" className="text-sm text-gray-600 hover:text-primary">For you</Link>
            <Link href="/login" className="text-sm text-gray-600 hover:text-primary">
              Sign In
            </Link>
            <Link href="/register" className="btn-outline px-3 py-1 text-sm">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}