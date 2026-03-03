import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  // Protect dashboard and pro routes; widget and public pages are open
  matcher: ["/dashboard/:path*", "/pro/:path*"],
};
