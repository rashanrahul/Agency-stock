
import { Link } from 'react-router-dom'

function Unauthorized() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-red-600">403</h1>
      <h2 className="text-xl font-semibold mt-3">Access Denied</h2>
      <p className="text-gray-500 mt-2">
        You don't have permission to access this page.
      </p>
      <Link to="/login" className="mt-5 text-blue-700 font-semibold">
        Back to Login
      </Link>
    </div>
  )
}

export default Unauthorized
