import Link from "next/link";
import {
  FiSearch,
  FiBell,
  FiCalendar,
  FiFolder,
  FiDollarSign,
  FiBarChart2,
  FiUsers,
  FiSettings,
} from "react-icons/fi";

const Navbar = () => {
  return (
    <nav className="flex justify-between items-center py-3 px-6 bg-white shadow">
      {/* Centered Links */}
      <div className="hidden md:flex space-x-5 mx-auto">
        <Link href="/" className="flex items-center gap-1 hover:text-blue-600">
          <FiBarChart2 />
          <span>Home</span>
        </Link>

        <Link
          href="/clients"
          className="flex items-center gap-1 hover:text-blue-600"
        >
          <FiUsers />
          <span>Clients</span>
        </Link>

        <Link
          href="/diary"
          className="flex items-center gap-1 hover:text-blue-600"
        >
          <FiCalendar />
          <span>Diary</span>
        </Link>

        <Link
          href="/documents"
          className="flex items-center gap-1 hover:text-blue-600"
        >
          <FiFolder />
          <span>Documents</span>
        </Link>

        <Link
          href="/billing"
          className="flex items-center gap-1 hover:text-blue-600"
        >
          <FiDollarSign />
          <span>Billing</span>
        </Link>
      </div>

      {/* Right side elements */}
      <div className="flex items-center gap-3 ml-auto">
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            className="pl-8 pr-3 py-1 rounded-full border border-gray-300 focus:outline-none focus:ring-1 focus:border-blue-500"
          />
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>

        <button className="relative p-1 rounded-full hover:bg-gray-100">
          <FiBell size={20} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <Link href="/settings" className="p-1 rounded-full hover:bg-gray-100">
          <FiSettings size={20} />
        </Link>

        <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
          <span className="font-medium text-sm">JD</span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
