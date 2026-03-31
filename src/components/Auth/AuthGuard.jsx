export default function AuthGuard({ user, children, fallback }) {
  if (user) {
    return children
  }

  return (
    fallback || (
      <div className="flex items-center justify-center p-8 text-gray-500">
        Please log in to continue.
      </div>
    )
  )
}
