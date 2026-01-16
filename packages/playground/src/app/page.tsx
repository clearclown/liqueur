/**
 * Root Page
 * Redirect to demo page
 */

import { redirect } from "next/navigation";

export default function Home() {
  redirect("/demo");
}
