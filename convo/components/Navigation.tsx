import Link from 'next/link';

const Navigation: React.FC = () => {
  return (
    <nav>
      {/* ... other navigation items ... */}
      <Link href="/interests">
        <a className="text-green-500 hover:text-green-700">Interests</a>
      </Link>
      {/* ... other navigation items ... */}
    </nav>
  );
};

export default Navigation;