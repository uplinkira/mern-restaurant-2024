import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

const Header = () => {
  const auth = useSelector(state => state.auth);
  const user = auth ? auth.user : null;

  return (
    <header className="bg-blue-500 p-4">
      <nav className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-white text-2xl font-bold">MERN-Restaurant</Link>
        <div>
          {user ? (
            <>
              <span className="text-white mr-4">Welcome, {user.email}</span>
              <button className="text-white">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-white mr-4">Login</Link>
              <Link to="/register" className="text-white">Register</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
