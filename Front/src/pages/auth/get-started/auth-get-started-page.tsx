import { Navigate } from 'react-router-dom';

export function AuthGetStartedPage() {
  return <Navigate to="/account/crm/leads" replace />;
}
