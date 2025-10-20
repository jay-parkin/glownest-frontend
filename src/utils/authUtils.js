import { jwtDecode } from "jwt-decode";

export default function isTokenExpired(token) {
  if (!token) return true;

  try {
    const { exp } = jwtDecode(token);
    if (!exp) return true;

    // exp is in seconds, Date.now() in ms
    return exp * 1000 < Date.now();
  } catch (err) {
    console.error("Invalid token format:", err);

    // If token can't be decoded, treat as expired
    return true;
  }
}
