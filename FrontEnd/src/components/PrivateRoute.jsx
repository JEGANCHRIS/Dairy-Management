import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PrivateRoute = ({ children, requiredRole = [] }) => {
  const { user, loading, isAuthenticated } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Check if NOT authenticated
  if (!isAuthenticated || !user) {
    console.log('PrivateRoute: Not authenticated, redirecting to login');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('user:', user);
    return <Navigate to="/login" replace />;
  }

  // Check role if required
  if (requiredRole.length > 0 && !requiredRole.includes(user?.role)) {
    console.log('PrivateRoute: Insufficient role', user?.role, 'required:', requiredRole);
    return <Navigate to="/" replace />;
  }

  console.log('PrivateRoute: Access granted', user?.role);
  return children;
};

export default PrivateRoute;