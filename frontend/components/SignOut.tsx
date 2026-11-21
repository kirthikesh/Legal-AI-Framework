export function SignOut() {
  return (
    <form action="/logout" method="post">
      <button type="submit" className="btn ghost">Sign out</button>
    </form>
  );
}
