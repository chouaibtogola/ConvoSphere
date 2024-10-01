import Link from 'next/link';

const Navigation: React.FC = () => {
  return (
    <nav>
      {/* ... other navigation items ... */}
      <Link href="/interests" className="text-blue-500 hover:text-blue-700">
        Interests
      </Link>
      {/* ... other navigation items ... */}
    </nav>
  );
};

export default Navigation;