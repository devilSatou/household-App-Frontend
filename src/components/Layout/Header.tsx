import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold text-gray-900">
              家計簿アプリ
            </Link>
            <nav className="hidden md:flex space-x-6">
              <Link
                to="/"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                ダッシュボード
              </Link>
              <Link
                to="/transactions"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                収支一覧
              </Link>
              <Link
                to="/monthly"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                月別レポート
              </Link>
              <Link
                to="/categories"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                カテゴリ
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <span className="text-gray-600 text-sm hidden sm:block">
                  {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-900 font-medium text-sm"
                >
                  ログアウト
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
